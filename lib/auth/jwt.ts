import jwt from 'jsonwebtoken';

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret || rawSecret.length < 32) {
  throw new Error(
    'JWT_SECRET must be set and at least 32 characters. Generate with: openssl rand -base64 48',
  );
}
const JWT_SECRET: string = rawSecret;

const ISSUER = 'nexcart';
const AUDIENCE = 'nexcart-web';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

export function verifyToken(token: string): JWTPayload {
  const decoded = jwt.verify(token, JWT_SECRET, {
    issuer: ISSUER,
    audience: AUDIENCE,
  }) as unknown as JWTPayload;
  return {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
  };
}
