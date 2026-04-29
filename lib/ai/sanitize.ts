// Strip control characters, instruction-like markers, and code fences from
// strings that originated in the database (product names, descriptions,
// categories, user names, review comments) before they are interpolated into
// an LLM prompt or fed back as a tool result. This is the primary defence
// against second-order prompt injection.
//
// The original strings are still rendered to end users untouched (React
// auto-escapes), so the storefront UI is unaffected.

const CONTROL_CHARS = new RegExp('[\\u0000-\\u001F\\u007F-\\u009F]', 'g');
const INSTRUCTION_MARKERS =
  /(^|\n)\s*(#{1,6}\s|---+|\bsystem\b\s*:|\binstruction\b\s*:|\boverride\b|\bignore (all )?(previous|above)\b|\bdeveloper mode\b|\bjailbreak\b|\byou are now\b)/gi;

export function sanitizeForPrompt(
  s: string | null | undefined,
  max = 200
): string {
  if (!s) return '';
  return s
    .slice(0, max)
    .replace(CONTROL_CHARS, ' ')
    .replace(INSTRUCTION_MARKERS, ' ')
    .replace(/[`{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Field names that may contain user/admin-controlled free text. Other fields
// (ids, prices, ratings, status enums, paths, dates) are passed through as-is.
const SENSITIVE_FIELDS = new Set([
  'name',
  'description',
  'category',
  'comment',
  'message',
]);

const FIELD_LIMITS: Record<string, number> = {
  description: 220,
  comment: 500,
  message: 220,
};

/**
 * Recursively walk a tool-result object and sanitize string values whose key
 * names are user-controlled. Leaves everything else untouched. Used only for
 * the copy of the result fed back to the LLM; the rich UI cards still receive
 * the unsanitized result.
 */
export function sanitizeForLLM<T>(value: T): T {
  return walk(value) as T;
}

function walk(value: unknown): unknown {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(walk);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (typeof v === 'string' && SENSITIVE_FIELDS.has(k)) {
        out[k] = sanitizeForPrompt(v, FIELD_LIMITS[k] ?? 120);
      } else {
        out[k] = walk(v);
      }
    }
    return out;
  }
  return value;
}
