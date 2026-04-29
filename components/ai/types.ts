export type ToolEvent = {
  name: string;
  args?: Record<string, unknown>;
  status: 'pending' | 'done';
  result?: {
    ok: boolean;
    data?: unknown;
    error?: string;
  };
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tools?: ToolEvent[];
  streaming?: boolean;
  errored?: boolean;
};

export type NotificationLevel = 'success' | 'error' | 'warn' | 'info';

export type StreamEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool_call'; name: string; args: Record<string, unknown> }
  | {
      type: 'tool_result';
      name: string;
      result: { ok: boolean; data?: unknown; error?: string };
    }
  | {
      type: 'client_action';
      action:
        | { type: 'navigate'; path: string }
        | { type: 'cart_update' }
        | { type: 'open_checkout'; url: string };
    }
  | {
      type: 'notification';
      level: NotificationLevel;
      message: string;
    }
  | { type: 'error'; error: string; level?: NotificationLevel }
  | { type: 'done' };
