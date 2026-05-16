import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '../../../../lib/auth';
import { readRecentAuditLogs } from '../../../../lib/audit';

export async function GET(request: NextRequest) {
  const session = getAuthSession(request);

  if (!session || session.legacy || session.role !== 'HR_ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limitParam = Number(searchParams.get('limit') || 100);
  const pageParam = Number(searchParams.get('page') || 1);
  const actor = (searchParams.get('actor') || '').trim().toLowerCase();
  const action = (searchParams.get('action') || '').trim().toLowerCase();
  const text = (searchParams.get('text') || '').trim().toLowerCase();
  const startDate = (searchParams.get('startDate') || '').trim();
  const endDate = (searchParams.get('endDate') || '').trim();

  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 500)) : 100;
  const page = Number.isFinite(pageParam) ? Math.max(1, pageParam) : 1;

  const logsAll = await readRecentAuditLogs();
  const logs = Array.isArray(logsAll) ? logsAll.slice(0, 500) : [];

  const filtered = logs.filter((log) => {
    if (actor && !String(log.actor || '').toLowerCase().includes(actor)) {
      return false;
    }

    if (action && !String(log.action || '').toLowerCase().includes(action)) {
      return false;
    }

    if (text) {
      const haystack = JSON.stringify(log).toLowerCase();
      if (!haystack.includes(text)) {
        return false;
      }
    }

    if (startDate) {
      const minDate = new Date(startDate);
      const rowDate = new Date(log.timestamp);
      if (!Number.isNaN(minDate.getTime()) && rowDate < minDate) {
        return false;
      }
    }

    if (endDate) {
      const maxDate = new Date(endDate);
      const rowDate = new Date(log.timestamp);

      if (!Number.isNaN(maxDate.getTime())) {
        maxDate.setHours(23, 59, 59, 999);
        if (rowDate > maxDate) {
          return false;
        }
      }
    }

    return true;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return NextResponse.json({
    success: true,
    data,
    meta: {
      total,
      returned: data.length,
      limit,
      page: safePage,
      totalPages,
    },
  });
}
