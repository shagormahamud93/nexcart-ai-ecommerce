import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';
import { parseImages } from '@/lib/utils/images';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { userId } = verifyToken(token);
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, userId },
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

    return NextResponse.json({ order: orderWithImages });
  } catch (error) {
    console.error('Fetch order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
