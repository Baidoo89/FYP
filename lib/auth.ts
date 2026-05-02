import type { NextRequest } from 'next/server';
import crypto from 'crypto';

export const SESSION_COOKIE_NAME = 'lpads_session';
const SESSION_COOKIE_VALUE = 'admin-authenticated';
export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  };
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'lpads-salt-2026').digest('hex');
}

// This function is deprecated - kept for backwards compatibility
// Use the API endpoint for actual login validation
export function isValidAdminLogin(username: string, password: string) {
  const credentials = getAdminCredentials();
  return username === credentials.username && password === credentials.password;
}

export function getSessionCookieValue() {
  return SESSION_COOKIE_VALUE;
}

export function isAuthenticatedRequest(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return cookie === SESSION_COOKIE_VALUE;
}
