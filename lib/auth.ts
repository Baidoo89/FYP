import type { NextRequest } from 'next/server';
import crypto from 'crypto';

export const SESSION_COOKIE_NAME = 'lpads_session';
const LEGACY_SESSION_COOKIE_VALUE = 'admin-authenticated';
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'lpads-fyp-secret';

export type AuthRole = 'LECTURER' | 'HR_ADMIN';

export type AuthSession = {
  userId: number;
  name: string;
  email: string;
  role: AuthRole;
  department?: string;
  onboarded?: boolean;
  iat: number;
  exp: number;
  legacy?: boolean;
};

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function signJwt(payload: string) {
  return crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payload)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  };
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'lpads-salt-2026').digest('hex');
}

export function createSessionToken(
  input: {
    userId: number;
    name: string;
    email: string;
    role: AuthRole;
    department?: string;
    onboarded?: boolean;
    legacy?: boolean;
  },
  expiresInSeconds = 60 * 60 * 8
) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AuthSession = {
    userId: input.userId,
    name: input.name,
    email: normalizeEmail(input.email),
    role: input.role,
    department: input.department,
    onboarded: input.onboarded,
    iat: now,
    exp: now + expiresInSeconds,
    legacy: input.legacy,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signJwt(`${encodedHeader}.${encodedPayload}`);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifySessionToken(token?: string | null): AuthSession | null {
  if (!token) {
    return null;
  }

  if (token === LEGACY_SESSION_COOKIE_VALUE) {
    return {
      userId: 0,
      name: 'Administrator',
      email: 'admin@example.com',
      role: 'HR_ADMIN',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
      legacy: true,
    };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = signJwt(`${encodedHeader}.${encodedPayload}`);

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AuthSession;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getAuthSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export function hasRequiredRole(request: NextRequest, allowedRoles: AuthRole[]) {
  const session = getAuthSession(request);
  return Boolean(session && allowedRoles.includes(session.role));
}

// This function is deprecated - kept for backwards compatibility
// Use the API endpoint for actual login validation
export function isValidAdminLogin(username: string, password: string) {
  const credentials = getAdminCredentials();
  return username === credentials.username && password === credentials.password;
}

export function getSessionCookieValue() {
  return LEGACY_SESSION_COOKIE_VALUE;
}

export function isAuthenticatedRequest(request: NextRequest) {
  return Boolean(getAuthSession(request));
}
