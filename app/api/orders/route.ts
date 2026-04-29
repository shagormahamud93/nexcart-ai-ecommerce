import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';
import { parseImages } from '@/lib/utils/images';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { userId } = verifyToken(token);

    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const ordersWithImages = orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        product: { ...item.product, images: parseImages(item.product.images) },
      })),
    }));

    return NextResponse.json({ orders: ordersWithImages });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
