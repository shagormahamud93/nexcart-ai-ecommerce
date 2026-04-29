import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const [categories, counts] = await Promise.all([
      prisma.category.findMany({
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      prisma.product.groupBy({
        by: ['category'],
        _count: { _all: true },
      }),
    ]);

    const countByName = new Map<string, number>();
    for (const row of counts) {
      countByName.set(row.category, row._count._all);
    }

    const totalProducts = Array.from(countByName.values()).reduce(
      (sum, n) => sum + n,
      0
    );

    return NextResponse.json({
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        image: c.image,
        description: c.description,
        productCount: countByName.get(c.name) ?? 0,
      })),
      totalProducts,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
