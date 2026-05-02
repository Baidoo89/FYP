import fs from 'fs/promises';
import path from 'path';
import type { NextRequest } from 'next/server';

type AuditAction =
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.logout'
  | 'appraisal.create'
  | 'report.export';

type AuditLogEntry = {
  timestamp: string;
  action: AuditAction;
  actor: string;
  ip: string;
  userAgent: string;
  details?: Record<string, unknown>;
};

const auditLogPath = path.join(process.cwd(), 'storage', 'audit-log.jsonl');

function getRequestIp(request?: NextRequest) {
  if (!request) {
    return 'unknown';
  }

  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function getUserAgent(request?: NextRequest) {
  if (!request) {
    return 'unknown';
  }

  return request.headers.get('user-agent') || 'unknown';
}

export async function appendAuditLog(params: {
  action: AuditAction;
  actor?: string;
  details?: Record<string, unknown>;
  request?: NextRequest;
}) {
  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    action: params.action,
    actor: params.actor || 'admin',
    ip: getRequestIp(params.request),
    userAgent: getUserAgent(params.request),
    details: params.details,
  };

  await fs.mkdir(path.dirname(auditLogPath), { recursive: true });
  await fs.appendFile(auditLogPath, `${JSON.stringify(entry)}\n`, 'utf8');
}

export async function readRecentAuditLogs(limit = 100) {
  try {
    const raw = await fs.readFile(auditLogPath, 'utf8');
    const lines = raw.split('\n').filter(Boolean);

    return lines
      .slice(-limit)
      .map((line) => JSON.parse(line) as AuditLogEntry)
      .reverse();
  } catch {
    return [] as AuditLogEntry[];
  }
}
