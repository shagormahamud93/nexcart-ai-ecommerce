import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { verifyToken } from '@/lib/auth/jwt';
import { createReviewSchema } from '@/lib/validations/review';
import { rateLimit } from '@/lib/ratelimit';

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
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const limit = rateLimit(`reviews:${payload.userId}`, {
      windowMs: 60 * 60_000,
      max: 20,
    });
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many reviews submitted. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
      );
    }

    const body = await request.json();
    const data = createReviewSchema.parse(body);

    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const existing = await prisma.review.findUnique({
      where: {
        userId_productId: { userId: payload.userId, productId: data.productId },
      },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 409 }
      );
    }

    const review = await prisma.review.create({
      data: {
        productId: data.productId,
        userId: payload.userId,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    const agg = await prisma.review.aggregate({
      where: { productId: data.productId },
      _avg: { rating: true },
    });
    await prisma.product.update({
      where: { id: data.productId },
      data: { rating: agg._avg.rating ?? 0 },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Create review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
