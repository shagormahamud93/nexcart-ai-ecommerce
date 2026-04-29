import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { verifyToken } from '@/lib/auth/jwt';
import { parseImages } from '@/lib/utils/images';

const addToCartSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).default(1),
});

type CartWithItems = Prisma.CartGetPayload<{
  include: { items: { include: { product: true } } };
}>;

function serializeCart(cart: CartWithItems) {
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

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { userId } = verifyToken(token);

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart) {
      return NextResponse.json({ items: [], total: 0 });
    }

    return NextResponse.json(serializeCart(cart));
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

class CartError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { userId } = verifyToken(token);
    const body = await request.json();
    const { productId, quantity } = addToCartSchema.parse(body);

    // Atomic transaction: re-read product+existing line inside the txn so two
    // concurrent add-to-cart requests cannot both pass the stock check.
    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new CartError('Product not found', 404);

      const cart =
        (await tx.cart.findUnique({ where: { userId } })) ??
        (await tx.cart.create({ data: { userId } }));

      const existingItem = await tx.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
      });

      const newQuantity = (existingItem?.quantity ?? 0) + quantity;
      if (newQuantity > product.stock) {
        throw new CartError('Insufficient stock', 400);
      }

      if (existingItem) {
        await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });
      } else {
        await tx.cartItem.create({
          data: { cartId: cart.id, productId, quantity },
        });
      }

      return tx.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      });
    });

    return NextResponse.json(updated ? serializeCart(updated) : { items: [], total: 0 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof CartError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Add to cart error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
