// Posts a product to a Facebook Page using the Graph API /photos endpoint.
//
// Required environment variables:
//   FACEBOOK_PAGE_ID            - Numeric ID of the target Page.
//   FACEBOOK_PAGE_ACCESS_TOKEN  - Long-lived Page access token with
//                                 `pages_manage_posts` and `pages_read_engagement`.
// Optional:
//   FACEBOOK_GRAPH_VERSION      - Defaults to v21.0.
//
// We use /photos rather than /feed because Facebook deprecated the `link`
// parameter on /feed in 2018; /photos posts the image prominently with the
// product URL clickable inside the caption.

const DEFAULT_GRAPH_VERSION = 'v21.0';
const FB_TIMEOUT_MS = 10_000;
const MAX_CAPTION_CHARS = 5000;

export type FacebookPostInput = {
  title: string;
  description?: string;
  imageUrl: string;
  productUrl: string;
};

export type FacebookPostResult =
  | {
      ok: true;
      postId: string;
      photoId: string;
    }
  | {
      ok: false;
      error: string;
      // True when posting was skipped because the env wasn't configured.
      // Callers should treat this as non-fatal.
      skipped?: boolean;
    };

function buildCaption({ title, description, productUrl }: FacebookPostInput): string {
  const parts = [title];
  if (description?.trim()) {
    parts.push('', description.trim());
  }
  parts.push('', `Shop now: ${productUrl}`);
  const caption = parts.join('\n');
  return caption.length > MAX_CAPTION_CHARS
    ? caption.slice(0, MAX_CAPTION_CHARS - 1) + '…'
    : caption;
}

export async function postProductToFacebook(
  input: FacebookPostInput,
): Promise<FacebookPostResult> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const version = process.env.FACEBOOK_GRAPH_VERSION || DEFAULT_GRAPH_VERSION;

  if (!pageId || !token) {
    return {
      ok: false,
      error: 'Facebook is not configured. Set FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN.',
      skipped: true,
    };
  }
  if (!input.imageUrl) {
    return { ok: false, error: 'imageUrl is required to post to a Facebook Page.' };
  }
  if (!/^https?:\/\//i.test(input.imageUrl)) {
    return { ok: false, error: 'imageUrl must be an absolute http(s) URL.' };
  }
  if (!/^https?:\/\//i.test(input.productUrl)) {
    return { ok: false, error: 'productUrl must be an absolute http(s) URL.' };
  }

  const endpoint = `https://graph.facebook.com/${version}/${encodeURIComponent(pageId)}/photos`;
  const body = new URLSearchParams({
    url: input.imageUrl,
    caption: buildCaption(input),
    published: 'true',
    access_token: token,
  });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FB_TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: ctrl.signal,
    });

    const json = (await res.json().catch(() => null)) as
      | { id?: string; post_id?: string; error?: { message?: string; code?: number } }
      | null;

    if (!res.ok || !json || json.error) {
      const msg =
        json?.error?.message ||
        `Facebook API returned HTTP ${res.status}.`;
      return { ok: false, error: msg };
    }
    if (!json.id || !json.post_id) {
      return { ok: false, error: 'Facebook response missing id/post_id.' };
    }
    return { ok: true, photoId: json.id, postId: json.post_id };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, error: 'Facebook request timed out.' };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Facebook request failed.',
    };
  } finally {
    clearTimeout(timer);
  }
}
