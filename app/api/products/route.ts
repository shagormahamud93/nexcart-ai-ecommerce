import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { verifyToken } from '@/lib/auth/jwt';
import { parseImages, serializeImages } from '@/lib/utils/images';
import { computeHotThreshold, getProductBadges } from '@/lib/utils/badges';

const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  oldPrice: z.number().positive().optional(),
  category: z.string().min(1),
  images: z.array(z.string()).default([]),
  stock: z.number().int().min(0).default(0),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('limit') || '12') || 12)
    );
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};
    if (category) {
      const matched = await prisma.category.findFirst({
        where: { OR: [{ slug: category }, { name: category }] },
        select: { name: true },
      });
      where.category = matched?.name ?? category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { reviews: { select: { rating: true } } },
      }),
      prisma.product.count({ where }),
    ]);

    const hotThreshold = computeHotThreshold(products.map((p) => p.salesCount));

    const productsWithRating = products.map((product) => {
      const reviewCount = product.reviews.length;
      const rating =
        reviewCount > 0
          ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
          : 0;
      const { reviews: _reviews, images, ...rest } = product;
      return {
        ...rest,
        images: parseImages(images),
        rating,
        reviewCount,
        badges: getProductBadges(product, { hotThreshold }),
      };
    });

    return NextResponse.json({
      products: productsWithRating,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const data = createProductSchema.parse(body);

    const product = await prisma.product.create({
      data: { ...data, images: serializeImages(data.images) },
    });

    return NextResponse.json(
      { ...product, images: parseImages(product.images) },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
