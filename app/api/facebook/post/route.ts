import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyToken } from '@/lib/auth/jwt';
import { postProductToFacebook } from '@/lib/facebook/post';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const postSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url(),
  productUrl: z.string().url(),
});

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const raw = await request.json().catch(() => null);
  if (raw == null) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const result = await postProductToFacebook(parsed.data);
  if (!result.ok) {
    // 503 when Facebook isn't configured (recoverable infra), 502 for upstream
    // Graph errors so callers can distinguish "we're not set up" from
    // "Facebook itself is unhappy".
    return NextResponse.json(
      { error: result.error, skipped: result.skipped ?? false },
      { status: result.skipped ? 503 : 502 },
    );
  }
  return NextResponse.json(result);
}
