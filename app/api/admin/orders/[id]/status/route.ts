import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';
import { parseImages } from '@/lib/utils/images';

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = updateStatusSchema.parse(body);

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: true } },
      },
    });

    const orderWithImages = {
      ...order,
      items: order.items.map((item) => ({
        ...item,
        product: { ...item.product, images: parseImages(item.product.images) },
      })),
    };

    return NextResponse.json({ order: orderWithImages });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid status', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Order status update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
