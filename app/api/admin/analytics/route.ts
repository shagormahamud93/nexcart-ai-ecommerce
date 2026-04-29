import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';

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

    const [totalRevenueAgg, totalOrders, totalUsers, totalProducts] = await Promise.all([
      prisma.order.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
      prisma.order.count({ where: { status: { not: 'CANCELLED' } } }),
      prisma.user.count(),
      prisma.product.count(),
    ]);

    // 12-month revenue, computed in JS to keep the route portable across DB backends.
    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const revenueOrders = await prisma.order.findMany({
      where: { status: { not: 'CANCELLED' }, createdAt: { gte: since } },
      select: { total: true, createdAt: true },
    });

    const monthBuckets = new Map<string, number>();
    for (let i = 0; i < 12; i++) {
      const d = new Date(since);
      d.setMonth(since.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthBuckets.set(key, 0);
    }
    for (const o of revenueOrders) {
      const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, '0')}`;
      monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + o.total);
    }
    const monthlyRevenue = Array.from(monthBuckets.entries()).map(([key, revenue]) => {
      const [year, month] = key.split('-').map(Number);
      const label = new Date(year, month - 1, 1).toLocaleString('en-US', {
        month: 'short',
        year: 'numeric',
      });
      return { month: label, revenue };
    });

    const topProductsRaw = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, price: true },
      orderBy: { _sum: { price: 'desc' } },
      take: 10,
    });

    const products = await prisma.product.findMany({
      where: { id: { in: topProductsRaw.map((p) => p.productId) } },
      select: { id: true, name: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p.name]));
    const topProducts = topProductsRaw.map((p) => ({
      name: productMap.get(p.productId) || 'Unknown Product',
      sales: p._sum.quantity ?? 0,
      revenue: p._sum.price ?? 0,
    }));

    const orderStatusGroups = await prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    const orderStatusDistribution = orderStatusGroups.map((s) => ({
      status: s.status,
      count: s._count.status,
    }));

    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    });

    const recentActivity = recentOrders.map((order) => ({
      id: order.id,
      type: 'order',
      description: `${order.user.name} placed an order for $${order.total.toFixed(2)}`,
      timestamp: order.createdAt.toISOString(),
    }));

    return NextResponse.json({
      totalRevenue: totalRevenueAgg._sum.total ?? 0,
      totalOrders,
      totalUsers,
      totalProducts,
      monthlyRevenue,
      topProducts,
      orderStatusDistribution,
      recentActivity,
    });
  } catch (error) {
    console.error('Admin analytics fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
