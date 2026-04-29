import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { verifyToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';
import { serializeImages } from '@/lib/utils/images';
import { postProductToFacebook } from '@/lib/facebook/post';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cap stored aiMetadata so a malicious or runaway payload can't bloat the row.
// 8 KB is roughly 5x the size of a typical generation record.
const MAX_META_BYTES = 8_192;

// Public origin used to build the absolute productUrl Facebook needs to
// scrape OG tags. Falls back to localhost in dev (FB won't reach it, but
// the call still succeeds locally for end-to-end testing of the code path).
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const publishSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  price: z.number().positive().finite(),
  oldPrice: z.number().positive().finite().optional(),
  category: z.string().min(1).max(80),
  stock: z.number().int().min(0).max(1_000_000).default(0),
  imageUrl: z.string().url().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  // Opt-out for the auto Facebook share. Defaults to true server-side.
  publishToFacebook: z.boolean().optional(),
});

// AI-image hosts that hand back temporary URLs. We still persist them, but the
// admin response includes a warning so the image can be replaced before expiry.
function isEphemeralImage(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return (
      host.endsWith('oaiusercontent.com') ||
      host.endsWith('openai.com') ||
      host.endsWith('blob.core.windows.net')
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    if (payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 },
      );
    }

    const raw = await request.json().catch(() => null);
    if (raw == null) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = publishSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 },
      );
    }
    const data = parsed.data;

    // Bounded JSON for the jsonb column.
    let aiMetadata: Prisma.InputJsonValue | undefined;
    if (data.meta) {
      const json = JSON.stringify(data.meta);
      if (json.length > MAX_META_BYTES) {
        return NextResponse.json(
          { error: `aiMetadata too large (max ${MAX_META_BYTES} bytes)` },
          { status: 413 },
        );
      }
      aiMetadata = data.meta as Prisma.InputJsonValue;
    }

    const ephemeral = isEphemeralImage(data.imageUrl);

    // Use the same JSON-string convention as the rest of the code base
    // (lib/utils/images.ts) so the existing read paths keep working unchanged.
    const images = data.imageUrl ? [data.imageUrl] : [];

    // Pull generation timestamp from meta if it's a valid ISO date; otherwise
    // record "now". Falling back rather than rejecting is intentional — the
    // admin can publish even if meta was edited or stripped client-side.
    const metaGeneratedAt =
      data.meta && typeof data.meta.generatedAt === 'string'
        ? new Date(data.meta.generatedAt)
        : null;
    const aiGeneratedAt =
      metaGeneratedAt && !Number.isNaN(metaGeneratedAt.getTime())
        ? metaGeneratedAt
        : new Date();

    const product = await prisma.product.create({
      data: {
        // Existing required Product fields — preserved as-is, no renames:
        name: data.title,
        description: data.description,
        price: data.price,
        oldPrice: data.oldPrice,
        category: data.category,
        images: serializeImages(images),
        stock: data.stock,
        // AI-tracking fields added in the schema task:
        aiImageUrl: data.imageUrl,
        aiMetadata,
        isAiGenerated: true,
        aiGeneratedAt,
      },
    });

    // The Product model uses a cuid `id` as its stable identifier, and the
    // existing detail page lives at /product/[id] — no slug column needed.
    const productUrl = `${SITE_URL.replace(/\/+$/, '')}/product/${product.id}`;

    // Best-effort Facebook auto-share. Failures here MUST NOT roll back the
    // product — the row is already committed. The result is surfaced in the
    // response so the admin can see what happened.
    let facebook: { posted: boolean; postId?: string; error?: string; skipped?: boolean } = {
      posted: false,
    };
    const shouldShare = data.publishToFacebook !== false && !!data.imageUrl;
    if (shouldShare) {
      try {
        const fbResult = await postProductToFacebook({
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl as string,
          productUrl,
        });
        if (fbResult.ok) {
          facebook = { posted: true, postId: fbResult.postId };
        } else {
          facebook = {
            posted: false,
            error: fbResult.error,
            skipped: fbResult.skipped,
          };
          // Log skipped (env not set) at info level, real failures at warn.
          if (fbResult.skipped) {
            console.info('Facebook auto-share skipped:', fbResult.error);
          } else {
            console.warn('Facebook auto-share failed:', fbResult.error);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.warn('Facebook auto-share threw:', msg);
        facebook = { posted: false, error: msg };
      }
    }

    return NextResponse.json(
      {
        id: product.id,
        url: `/product/${product.id}`,
        warning: ephemeral
          ? 'Image URL is temporary (~1 hour). Replace it via the product edit page before it expires.'
          : null,
        facebook,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Publish AI product Prisma error:', err.code, err.message);
      return NextResponse.json(
        { error: 'Database error', code: err.code },
        { status: 500 },
      );
    }
    if (err instanceof Prisma.PrismaClientValidationError) {
      console.error('Publish AI product validation error:', err.message);
      return NextResponse.json(
        { error: 'Database validation failed' },
        { status: 500 },
      );
    }
    console.error('Publish AI product error:', err);
    return NextResponse.json(
      { error: 'Failed to publish product' },
      { status: 500 },
    );
  }
}
