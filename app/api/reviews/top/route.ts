import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { parseImages } from '@/lib/utils/images';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 20);
    const minRating = parseInt(searchParams.get('minRating') || '4');

    const reviews = await prisma.review.findMany({
      where: {
        rating: { gte: minRating },
        comment: { not: '' },
      },
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        product: { select: { id: true, name: true, images: true } },
      },
    });

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        ...r,
        product: { ...r.product, images: parseImages(r.product.images) },
      })),
    });
  } catch (error) {
    console.error('Top reviews error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
