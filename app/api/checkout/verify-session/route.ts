import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';
import { parseImages } from '@/lib/utils/images';

export async function GET(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = verifyToken(token);

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.userId !== payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const order = await prisma.order.findUnique({
      where: { id: session.metadata?.orderId ?? '' },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderWithImages = {
      ...order,
      items: order.items.map((item) => ({
        ...item,
        product: { ...item.product, images: parseImages(item.product.images) },
      })),
    };

    return NextResponse.json({
      order: orderWithImages,
      session: { id: session.id, payment_status: session.payment_status },
    });
  } catch (error) {
    console.error('Verify session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
