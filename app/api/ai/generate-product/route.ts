import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { verifyToken } from '@/lib/auth/jwt';
import { rateLimit, ipFrom } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TEXT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'dall-e-3';
const REQUEST_TIMEOUT_MS = 45_000;

const inputSchema = z.object({
  idea: z.string().min(3).max(500),
  category: z.string().min(1).max(80).optional(),
  priceRange: z
    .object({
      min: z.number().nonnegative().optional(),
      max: z.number().positive().optional(),
    })
    .refine(
      (r) => r.min == null || r.max == null || r.min <= r.max,
      { message: 'priceRange.min must be <= priceRange.max' },
    )
    .optional(),
});

// Strict shape the model must return. Mirrors required Prisma Product fields
// so the result can be passed straight into prisma.product.create() later.
const aiProductSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(20).max(2000),
  price: z.number().positive(),
  category: z.string().min(1).max(80),
  imagePrompt: z.string().min(10).max(800),
});

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: 'AI is not configured. Set OPENAI_API_KEY on the server.' },
      { status: 503 },
    );
  }

  const token = request.cookies.get('token')?.value;
  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return Response.json({ error: 'Invalid session' }, { status: 401 });
  }
  if (payload.role !== 'ADMIN') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  // Image generation is expensive; keep this tighter than the chat route.
  const ip = ipFrom(request);
  const rl = rateLimit(`ai:gen-product:${payload.userId}:${ip}`, {
    windowMs: 60 * 60_000,
    max: 30,
  });
  if (!rl.ok) {
    return Response.json(
      { error: 'Too many generations. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsedInput = inputSchema.safeParse(raw);
  if (!parsedInput.success) {
    return Response.json(
      { error: 'Invalid input', details: parsedInput.error.issues },
      { status: 400 },
    );
  }
  const input = parsedInput.data;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const timeoutCtrl = new AbortController();
  const timeoutId = setTimeout(() => timeoutCtrl.abort(), REQUEST_TIMEOUT_MS);
  const onClientAbort = () => timeoutCtrl.abort();
  if (request.signal.aborted) timeoutCtrl.abort();
  else request.signal.addEventListener('abort', onClientAbort, { once: true });

  try {
    const priceLine = input.priceRange
      ? `Target price range in USD: ${input.priceRange.min ?? 'no minimum'} to ${input.priceRange.max ?? 'no maximum'}. Price MUST fall inside this range.`
      : 'Pick a realistic retail price in USD for this kind of product.';
    const categoryLine = input.category
      ? `Use this category exactly: ${input.category}.`
      : 'Pick a sensible single-word or short category name (e.g. "Home Office", "Kitchen", "Apparel").';

    const completion = await openai.chat.completions.parse(
      {
        model: TEXT_MODEL,
        temperature: 0.8,
        messages: [
          {
            role: 'system',
            content:
              'You are a product copywriter for an e-commerce store. Generate realistic, on-brand product listings. Descriptions are concrete, factual, and free of emojis, markdown, and placeholder text. Never invent regulated claims (medical, financial, safety certifications).',
          },
          {
            role: 'user',
            content: [
              `Product idea: ${input.idea}`,
              categoryLine,
              priceLine,
              'Also produce a vivid, photographic image-generation prompt under 80 words for a clean studio product photo on a neutral background. No text, no watermark, no people unless inherent to the product.',
            ].join('\n'),
          },
        ],
        response_format: zodResponseFormat(aiProductSchema, 'product'),
      },
      { signal: timeoutCtrl.signal },
    );

    const generated = completion.choices[0]?.message.parsed;
    if (!generated) {
      return Response.json(
        { error: 'AI returned an empty response.' },
        { status: 502 },
      );
    }

    // Hard-clamp price into the requested range and round to 2dp so the value
    // is safe to insert into Prisma's Float price column.
    let price = generated.price;
    if (input.priceRange?.min != null && price < input.priceRange.min) {
      price = input.priceRange.min;
    }
    if (input.priceRange?.max != null && price > input.priceRange.max) {
      price = input.priceRange.max;
    }
    price = Math.round(price * 100) / 100;

    const image = await openai.images.generate(
      {
        model: IMAGE_MODEL,
        prompt: generated.imagePrompt,
        size: '1024x1024',
        n: 1,
        response_format: 'url',
      },
      { signal: timeoutCtrl.signal },
    );

    const imageUrl = image.data?.[0]?.url ?? null;

    // Response shape matches Prisma Product fields:
    //   title       -> Product.name
    //   description -> Product.description
    //   price       -> Product.price (Float)
    //   imageUrl    -> Product.aiImageUrl  (and/or pushed into images JSON)
    // `meta` is extra context useful when persisting (e.g. into Product.aiMetadata
    // jsonb); the client may ignore it. Per the rules of this task, we do NOT
    // write to the database here — that belongs to the next step.
    //
    // NOTE: dall-e-3 URLs expire ~1 hour after generation. The save step must
    // re-download and upload to Cloudinary (already in deps) before persisting.
    // Admin's input wins; otherwise use the AI's suggestion.
    const finalCategory = input.category?.trim() || generated.category;

    return Response.json({
      title: generated.title,
      description: generated.description,
      price,
      category: finalCategory,
      imageUrl,
      meta: {
        adminCategory: input.category ?? null,
        suggestedCategory: generated.category,
        textModel: TEXT_MODEL,
        imageModel: IMAGE_MODEL,
        imagePrompt: generated.imagePrompt,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      const status =
        err.status === 401 || err.status === 403 || err.status === 429
          ? err.status
          : err.status && err.status >= 500
            ? 502
            : 400;
      console.error('AI generate-product error:', err.status, err.message);
      return Response.json({ error: err.message }, { status });
    }
    if (err instanceof Error && err.name === 'AbortError') {
      return Response.json(
        { error: 'Generation cancelled or timed out.' },
        { status: 504 },
      );
    }
    console.error('AI generate-product error:', err);
    return Response.json(
      { error: 'Failed to generate product.' },
      { status: 500 },
    );
  } finally {
    clearTimeout(timeoutId);
    request.signal.removeEventListener('abort', onClientAbort);
  }
}
