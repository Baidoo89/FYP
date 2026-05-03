import { getRows } from './db';
import type { NextRequest } from 'next/server';

export async function appendAuditLog(params: any) {
  const { request, action, actor, details } = params;

  const ip =
    request?.headers.get('x-forwarded-for') ||
    request?.headers.get('x-real-ip') ||
    'unknown';

  const userAgent = request?.headers.get('user-agent') || 'unknown';

  await getRows(
    `INSERT INTO audit_logs (action, actor, ip, user_agent, details)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      action,
      actor || 'admin',
      ip,
      userAgent,
      JSON.stringify(details || {}),
    ]
  );
}

export async function readRecentAuditLogs() {
  return [];
}