import { insert, getRows } from './db';
import type { NextRequest } from 'next/server';

export async function appendAuditLog(params: {
  action: string;
  actor?: string;
  details?: Record<string, unknown>;
  request?: NextRequest;
}) {
  await insert('audit_logs', {
    action: params.action,
    actor: params.actor || 'admin',
    ip:
      params.request?.headers.get('x-forwarded-for') ||
      params.request?.headers.get('x-real-ip') ||
      'unknown',
    user_agent: params.request?.headers.get('user-agent') || 'unknown',
    details: params.details || {},
  });
}

export async function readRecentAuditLogs(limit = 100) {
  return await getRows(
    `SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT $1`,
    [limit]
  );
}