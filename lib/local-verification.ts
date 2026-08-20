import type { NextRequest } from 'next/server';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export function canExposeLocalVerificationUrl(request: NextRequest, provider: string) {
  return provider.trim().toLowerCase() === 'development'
    && LOCAL_HOSTS.has(request.nextUrl.hostname.toLowerCase());
}