import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload || typeof payload === 'string' || payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    // Get dashboard statistics
    const [
      totalUsers,
      totalOrders,
      totalRevenueResult,
      pendingOrders,
      lowStockProducts,
      recentOrders,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Total orders
      prisma.order.count(),

      // Total revenue
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: 'CANCELLED' } },
      }),

      // Pending orders
      prisma.order.count({
        where: { status: 'PENDING' },
      }),

      // Low stock products (less than 10)
      prisma.product.count({
        where: { stock: { lt: 10 } },
      }),

      // Recent orders (last 5)
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
    ]);

    const totalRevenue = totalRevenueResult._sum.total || 0;

    return NextResponse.json({
      totalUsers,
      totalOrders,
      totalRevenue,
      pendingOrders,
      lowStockProducts,
      recentOrders,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}