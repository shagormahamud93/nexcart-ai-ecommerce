import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyToken } from '@/lib/auth/jwt';
import { createCheckoutSession, isStripeConfigured } from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';
import { parseImages } from '@/lib/utils/images';
import { rateLimit } from '@/lib/ratelimit';

const createCheckoutSchema = z.object({
  shippingAddress: z.object({
    street: z.string().trim().min(1).max(200),
    city: z.string().trim().min(1).max(100),
    state: z.string().trim().min(1).max(100),
    zip: z.string().trim().min(1).max(20),
    country: z.string().trim().min(1).max(60),
  }),
});

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error:
            'Stripe is not configured. Set STRIPE_SECRET_KEY in .env to enable checkout.',
        },
        { status: 503 }
      );
    }

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = verifyToken(token);

    const limit = rateLimit(`checkout:${payload.userId}`, {
      windowMs: 60 * 60_000,
      max: 5,
    });
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many checkout attempts. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
      );
    }

    // Cap concurrent pending orders so an attacker can't flood the orders table.
    const pendingCount = await prisma.order.count({
      where: {
        userId: payload.userId,
        status: 'PENDING',
        createdAt: { gte: new Date(Date.now() - 60 * 60_000) },
      },
    });
    if (pendingCount > 10) {
      return NextResponse.json(
        { error: 'Too many pending checkouts. Please complete or cancel them first.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { shippingAddress } = createCheckoutSchema.parse(body);

    const cart = await prisma.cart.findUnique({
      where: { userId: payload.userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    for (const item of cart.items) {
      if (item.quantity > item.product.stock) {
        return NextResponse.json(
          { error: `Insufficient stock for ${item.product.name}` },
          { status: 400 }
        );
      }
    }

    const items = cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.product.price,
      name: item.product.name,
      image: parseImages(item.product.images)[0],
    }));

    const { session, order } = await createCheckoutSession(
      payload.userId,
      items,
      shippingAddress
    );

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      orderId: order.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Create checkout session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
