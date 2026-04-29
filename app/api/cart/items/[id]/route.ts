import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { verifyToken } from '@/lib/auth/jwt';
import { parseImages } from '@/lib/utils/images';

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0),
});

type CartWithItems = Prisma.CartGetPayload<{
  include: { items: { include: { product: true } } };
}>;

function serializeCart(cart: CartWithItems | null) {
  if (!cart) return { items: [], total: 0 };
  const items = cart.items.map((item) => ({
    ...item,
    product: { ...item.product, images: parseImages(item.product.images) },
  }));
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  return { items, total };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { userId } = verifyToken(token);
    const body = await request.json();
    const { quantity } = updateCartItemSchema.parse(body);

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true, product: true },
    });
    if (!cartItem || cartItem.cart.userId !== userId) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    if (quantity === 0) {
      await prisma.cartItem.delete({ where: { id } });
    } else {
      if (cartItem.product.stock < quantity) {
        return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
      }
      await prisma.cartItem.update({ where: { id }, data: { quantity } });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
    return NextResponse.json(serializeCart(cart));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Update cart item error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { userId } = verifyToken(token);

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true },
    });
    if (!cartItem || cartItem.cart.userId !== userId) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    await prisma.cartItem.delete({ where: { id } });

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
    return NextResponse.json(serializeCart(cart));
  } catch (error) {
    console.error('Delete cart item error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
