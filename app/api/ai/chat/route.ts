import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { verifyToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';
import { executeTool, toolDefinitions, type ToolContext, type ToolResult } from '@/lib/ai/tools';
import { buildSystemPrompt } from '@/lib/ai/systemPrompt';
import { buildLiveContext } from '@/lib/ai/context';
import { sanitizeForLLM } from '@/lib/ai/sanitize';
import { rateLimit, ipFrom } from '@/lib/ratelimit';
import type { NotificationLevel } from '@/components/ai/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type IncomingMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type IncomingBody = {
  messages?: IncomingMessage[];
  pageContext?: { path?: string };
};

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MAX_TOOL_ITERATIONS = 6;
const MAX_HISTORY = 20;
const MAX_MESSAGE_CHARS = 4000;
const REQUEST_TIMEOUT_MS = 30_000;

// Conservative pre-filter for the most common jailbreak phrases. Legitimate
// shopping intent never matches these, so false positives are extremely rare.
const JAILBREAK_PATTERNS =
  /(ignore (all )?(previous|above) (instructions|rules)|developer mode|jailbreak|DAN mode|reveal (the|your) system prompt|you are now [a-z ]{0,40}(unrestricted|uncensored))/i;

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: 'AI is not configured. Set OPENAI_API_KEY on the server.' },
      { status: 503 }
    );
  }

  let body: IncomingBody;
  try {
    body = (await request.json()) as IncomingBody;
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const trimmed = incoming
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.length <= MAX_MESSAGE_CHARS
    )
    .slice(-MAX_HISTORY);
  if (trimmed.length === 0 || trimmed[trimmed.length - 1].role !== 'user') {
    return Response.json({ error: 'Last message must be from user.' }, { status: 400 });
  }
  const currentPath =
    typeof body.pageContext?.path === 'string' ? body.pageContext.path : null;

  let ctx: ToolContext = { userId: null, userRole: null };
  let userName: string | null = null;
  const token = request.cookies.get('token')?.value;
  if (token) {
    try {
      const payload = verifyToken(token);
      ctx = { userId: payload.userId, userRole: payload.role };
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { name: true, isActive: true },
      });
      // Treat deactivated accounts as anonymous for chat purposes.
      if (user && user.isActive) {
        userName = user.name;
      } else {
        ctx = { userId: null, userRole: null };
      }
    } catch {
      // Treat invalid/expired tokens as anonymous.
    }
  }

  // Rate limit: tighter for anonymous (cost/abuse vector), looser for signed-in.
  const ip = ipFrom(request);
  const rlKey = ctx.userId ? `ai:user:${ctx.userId}` : `ai:ip:${ip}`;
  const rlOpts = ctx.userId
    ? { windowMs: 60 * 60_000, max: 60 }
    : { windowMs: 60 * 60_000, max: 10 };
  const rl = rateLimit(rlKey, rlOpts);
  if (!rl.ok) {
    return Response.json(
      { error: 'You are sending messages too quickly. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  // Cheap jailbreak pre-filter on the latest user message.
  const lastUser = trimmed[trimmed.length - 1].content;
  if (JAILBREAK_PATTERNS.test(lastUser)) {
    return Response.json(
      { error: 'This request can’t be processed.' },
      { status: 400 },
    );
  }

  const liveContext = await buildLiveContext({
    userId: ctx.userId,
    currentPath,
  });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: buildSystemPrompt({
        isAuthenticated: !!ctx.userId,
        userName,
        context: liveContext,
        currentPath,
      }),
    },
    ...trimmed.map(
      (m): ChatCompletionMessageParam => ({ role: m.role, content: m.content })
    ),
  ];

  // Compose client-abort and server-timeout signals so a runaway request can't
  // hold the OpenAI connection open indefinitely.
  const timeoutCtrl = new AbortController();
  const timeoutId = setTimeout(() => timeoutCtrl.abort(), REQUEST_TIMEOUT_MS);
  const onClientAbort = () => timeoutCtrl.abort();
  if (request.signal.aborted) timeoutCtrl.abort();
  else request.signal.addEventListener('abort', onClientAbort, { once: true });
  const requestSignal = timeoutCtrl.signal;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
        } catch {
          // Stream already closed (client aborted) — ignore.
        }
      };

      const aborted = () => requestSignal.aborted;

      try {
        for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
          if (aborted()) break;

          const completion = await openai.chat.completions.create(
            {
              model: MODEL,
              messages,
              tools: toolDefinitions,
              tool_choice: 'auto',
              temperature: 0.4,
              stream: true,
            },
            { signal: requestSignal }
          );

          let textBuf = '';
          const toolCalls: Array<{ id: string; name: string; args: string }> = [];
          let finishReason: string | null = null;

          for await (const chunk of completion) {
            if (aborted()) break;
            const choice = chunk.choices[0];
            if (!choice) continue;
            const delta = choice.delta;

            if (delta?.content) {
              textBuf += delta.content;
              send({ type: 'text', delta: delta.content });
            }

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                if (!toolCalls[idx]) {
                  toolCalls[idx] = { id: '', name: '', args: '' };
                }
                if (tc.id) toolCalls[idx].id = tc.id;
                if (tc.function?.name) toolCalls[idx].name += tc.function.name;
                if (tc.function?.arguments) toolCalls[idx].args += tc.function.arguments;
              }
            }

            if (choice.finish_reason) finishReason = choice.finish_reason;
          }

          if (toolCalls.length === 0 || finishReason === 'stop') {
            break;
          }

          messages.push({
            role: 'assistant',
            content: textBuf || null,
            tool_calls: toolCalls.map((tc) => ({
              id: tc.id,
              type: 'function' as const,
              function: { name: tc.name, arguments: tc.args || '{}' },
            })),
          });

          for (const tc of toolCalls) {
            if (aborted()) break;
            let parsedArgs: Record<string, unknown> = {};
            try {
              parsedArgs = tc.args ? JSON.parse(tc.args) : {};
            } catch {
              parsedArgs = {};
            }

            send({ type: 'tool_call', name: tc.name, args: parsedArgs });

            const result = await executeTool(tc.name, parsedArgs, ctx);

            send({ type: 'tool_result', name: tc.name, result });
            if (result.clientAction) {
              send({ type: 'client_action', action: result.clientAction });
            }

            const note = toolToNotification(tc.name, parsedArgs, result);
            if (note) send({ type: 'notification', ...note });

            // Sanitize the copy fed back to the LLM so user/admin-controlled
            // fields (product name/description/category, cart-line names,
            // success messages) can't carry second-order prompt injection.
            // The rich UI cards above still receive the original `result`.
            messages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: JSON.stringify(sanitizeForLLM(result)),
            });
          }
        }

        send({ type: 'done' });
      } catch (err) {
        const { message, level } = describeServerError(err);
        console.error('AI stream error:', err);
        send({ type: 'error', error: message, level });
        send({ type: 'notification', level, message });
      } finally {
        clearTimeout(timeoutId);
        request.signal.removeEventListener('abort', onClientAbort);
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      }
    },
    cancel() {
      // Client aborted — propagate to OpenAI through the composite signal.
      timeoutCtrl.abort();
      clearTimeout(timeoutId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}

function describeServerError(
  err: unknown
): { message: string; level: NotificationLevel } {
  if (err instanceof OpenAI.APIError) {
    if (err.status === 429) {
      return {
        message: 'The assistant is busy. Please try again in a moment.',
        level: 'warn',
      };
    }
    if (err.status === 401 || err.status === 403) {
      return {
        message: 'AI service authentication failed. Please contact support.',
        level: 'error',
      };
    }
    if (err.status === 400) {
      return { message: `Bad request: ${err.message}`, level: 'error' };
    }
    if (err.status && err.status >= 500) {
      return {
        message: 'AI service is temporarily unavailable. Please try again.',
        level: 'error',
      };
    }
    return { message: err.message, level: 'error' };
  }
  if (err instanceof Error) {
    if (err.name === 'AbortError') {
      return { message: 'Request cancelled.', level: 'info' };
    }
    return { message: err.message, level: 'error' };
  }
  return { message: 'Something went wrong.', level: 'error' };
}

function toolToNotification(
  name: string,
  _args: Record<string, unknown>,
  result: ToolResult
): { level: NotificationLevel; message: string } | null {
  if (!result.ok) {
    if (result.error === 'AUTH_REQUIRED') {
      return { level: 'warn', message: 'Please sign in to continue.' };
    }
    if (result.error === 'INSUFFICIENT_STOCK') {
      const available = (result.data as { available?: number })?.available;
      return {
        level: 'warn',
        message:
          typeof available === 'number'
            ? `Only ${available} in stock.`
            : 'Not enough stock available.',
      };
    }
    // Generic tool error — surface only for action tools (not searches).
    if (
      ['addToCart', 'removeFromCart', 'updateCartQuantity', 'clearCart'].includes(name)
    ) {
      return { level: 'error', message: `Couldn't ${prettyVerb(name)}.` };
    }
    return null;
  }

  // Success path — only notify for state-changing actions.
  const data = result.data as Record<string, unknown> | undefined;
  switch (name) {
    case 'addToCart':
      return {
        level: 'success',
        message: typeof data?.message === 'string' ? data.message : 'Added to cart.',
      };
    case 'removeFromCart':
      return {
        level: 'success',
        message:
          typeof data?.message === 'string' ? data.message : 'Removed from cart.',
      };
    case 'updateCartQuantity':
      return {
        level: 'success',
        message: typeof data?.message === 'string' ? data.message : 'Cart updated.',
      };
    case 'clearCart':
      return { level: 'success', message: 'Cart cleared.' };
    default:
      return null;
  }
}

function prettyVerb(name: string): string {
  switch (name) {
    case 'addToCart':
      return 'add that to your cart';
    case 'removeFromCart':
      return 'remove that from your cart';
    case 'updateCartQuantity':
      return 'update the quantity';
    case 'clearCart':
      return 'clear your cart';
    default:
      return 'complete that action';
  }
}
