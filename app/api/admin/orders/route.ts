import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { verifyToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';
import { parseImages } from '@/lib/utils/images';

const VALID_STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') || '20') || 20)
    );
    const status = searchParams.get('status') || 'ALL';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;
    const where: Prisma.OrderWhereInput = {};

    if (status !== 'ALL' && (VALID_STATUSES as readonly string[]).includes(status)) {
      where.status = status as (typeof VALID_STATUSES)[number];
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          items: { include: { product: { select: { name: true, images: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const ordersWithImages = orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        product: { ...item.product, images: parseImages(item.product.images) },
      })),
    }));

    return NextResponse.json({
      orders: ordersWithImages,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit) || 1,
      totalCount,
    });
  } catch (error) {
    console.error('Admin orders fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
