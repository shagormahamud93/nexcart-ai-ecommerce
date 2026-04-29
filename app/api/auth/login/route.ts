import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { generateToken } from '@/lib/auth/jwt';
import { rateLimit, ipFrom } from '@/lib/ratelimit';

const loginSchema = z.object({
  email: z.string().email().max(254),
  // Keep min(6) to preserve compatibility with legacy passwords on existing
  // accounts. Register tightens this to 8.
  password: z.string().min(6).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const ip = ipFrom(request);
    const ipLimit = rateLimit(`login:ip:${ip}`, { windowMs: 15 * 60_000, max: 20 });
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfter) } },
      );
    }

    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const emailLimit = rateLimit(`login:email:${email.toLowerCase()}`, {
      windowMs: 15 * 60_000,
      max: 10,
    });
    if (!emailLimit.ok) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(emailLimit.retryAfter) } },
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is disabled. Contact support.' },
        { status: 403 }
      );
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Set cookie
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours — matches JWT TTL
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
