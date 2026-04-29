import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';

function clearCookie(res: NextResponse) {
  res.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return clearCookie(
        NextResponse.json({ error: 'Invalid token' }, { status: 401 }),
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        addresses: true,
        createdAt: true,
      },
    });

    if (!user) {
      return clearCookie(
        NextResponse.json({ error: 'User not found' }, { status: 404 }),
      );
    }

    if (!user.isActive) {
      return clearCookie(
        NextResponse.json({ error: 'Account is disabled' }, { status: 401 }),
      );
    }

    // Strip isActive from the response shape (preserves existing client contract).
    const { isActive: _isActive, ...publicUser } = user;
    return NextResponse.json({ user: publicUser });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
