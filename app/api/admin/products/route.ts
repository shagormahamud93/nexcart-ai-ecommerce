import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { verifyToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';
import { parseImages } from '@/lib/utils/images';

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
    const category = searchParams.get('category') || 'ALL';
    const stock = searchParams.get('stock') || 'ALL';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = {};

    if (category !== 'ALL') where.category = category;

    if (stock !== 'ALL') {
      switch (stock) {
        case 'LOW':
          where.stock = { lt: 10, gt: 0 };
          break;
        case 'OUT':
          where.stock = 0;
          break;
        case 'IN':
          where.stock = { gt: 0 };
          break;
      }
    }

    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products: products.map((p) => ({ ...p, images: parseImages(p.images) })),
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit) || 1,
      totalCount,
    });
  } catch (error) {
    console.error('Admin products fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
