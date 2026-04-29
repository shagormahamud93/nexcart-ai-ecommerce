import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/db/prisma';

const stripeKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeKey
  ? new Stripe(stripeKey, { apiVersion: '2026-03-25.dahlia' })
  : (null as unknown as Stripe);

export function isStripeConfigured() {
  return Boolean(stripeKey) && !stripeKey!.includes('your_secret_key_here');
}

type CheckoutItem = {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  image?: string;
};

type ShippingAddress = {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export async function createCheckoutSession(
  userId: string,
  items: CheckoutItem[],
  shippingAddress: ShippingAddress
) {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in .env');
  }

  const order = await prisma.order.create({
    data: {
      userId,
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: 'PENDING',
      shippingStreet: shippingAddress.street,
      shippingCity: shippingAddress.city,
      shippingState: shippingAddress.state,
      shippingZip: shippingAddress.zip,
      shippingCountry: shippingAddress.country,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    },
    include: { items: { include: { product: true } } },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })),
    mode: 'payment',
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/checkout/cancelled`,
    metadata: { orderId: order.id, userId },
    customer_email: user?.email,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentIntent: session.id },
  });

  return { session, order };
}

const HANDLED_EVENTS = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
]);

const TERMINAL_STATUSES = new Set(['PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']);

export async function handleWebhook(rawBody: string, signature: string) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    // Signature verification failed — caller already returned 400.
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (!HANDLED_EVENTS.has(event.type)) {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    const userId = session.metadata?.userId;

    if (event.type === 'checkout.session.async_payment_failed') {
      if (orderId) {
        const existing = await prisma.order.findUnique({ where: { id: orderId } });
        if (existing && !TERMINAL_STATUSES.has(existing.status)) {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: 'CANCELLED' },
          });
        }
      }
      return NextResponse.json({ received: true });
    }

    // Only mark PAID once Stripe has confirmed funds are settled. Async payment
    // methods (ACH, BLIK, OXXO, …) fire `checkout.session.completed` while
    // payment_status is still `unpaid` — handled by the async_payment_succeeded
    // event branch above with payment_status === 'paid'.
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true });
    }

    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        console.error('Webhook: order not found', { orderId });
        return NextResponse.json({ received: true });
      }
      // Idempotent: do nothing if already in a terminal state.
      if (TERMINAL_STATUSES.has(order.status)) {
        return NextResponse.json({ received: true });
      }
      // Tamper check: amount Stripe charged must match what we expect.
      if (
        typeof session.amount_total === 'number' &&
        session.amount_total !== Math.round(order.total * 100)
      ) {
        console.error('Webhook: amount mismatch — refusing to mark PAID', {
          orderId,
          dbTotalCents: Math.round(order.total * 100),
          stripeTotal: session.amount_total,
        });
        return NextResponse.json({ received: true });
      }
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      });
    }

    if (userId) {
      await prisma.cartItem.deleteMany({ where: { cart: { userId } } });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
}
