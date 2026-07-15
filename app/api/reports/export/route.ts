import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Prisma } from '@prisma/client';
import {
  applyReportingFilters,
  computeDashboardMetrics,
  computePromotionCandidates,
  loadReportingData,
} from '../../../../lib/reporting';
import { getAuthSession, type AuthSession } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { writeAuditLog } from '../../../../lib/audit-logger';
import { loadPromotionAnalytics, promotionAnalyticsToCsv } from '../../../../lib/promotion-analytics';

type ExportType = 'dashboard' | 'promotions' | 'analytics' | 'audit';
type ExportFormat = 'csv' | 'pdf';

function escapeCsvValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function toCsv(headers: string[], rows: Array<Array<string | number | boolean | null | undefined>>) {
  const csvRows = [headers.map(escapeCsvValue).join(',')];

  for (const row of rows) {
    csvRows.push(row.map(escapeCsvValue).join(','));
  }

  return csvRows.join('\n');
}

async function toPdf(
  title: string,
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>
) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([842, 595]);
  let y = 560;

  const drawLine = (text: string, isHeader = false) => {
    if (y < 40) {
      page = doc.addPage([842, 595]);
      y = 560;
    }

    page.drawText(text, {
      x: 24,
      y,
      size: isHeader ? 11 : 9,
      font: isHeader ? bold : font,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: 790,
    });

    y -= isHeader ? 18 : 14;
  };

  drawLine(`${title} (${new Date().toISOString().slice(0, 10)})`, true);
  drawLine(headers.join(' | '), true);

  for (const row of rows) {
    drawLine(row.map((value) => String(value ?? '')).join(' | '));
  }

  return doc.save();
}

function buildDashboardCsv(filters: { department?: string; startDate?: string; endDate?: string }) {
  return async () => {
    const reportingData = applyReportingFilters(await loadReportingData(), filters);
    const metrics = computeDashboardMetrics(reportingData);

    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Lecturers', metrics.total_lecturers],
      ['Average Performance Score', metrics.average_performance_score],
      ['Excellent Count', metrics.excellent_count],
      ['Good Count', metrics.good_count],
      ['Average Count', metrics.average_count],
      ['Poor Count', metrics.poor_count],
      ['Promotion Candidates', metrics.promotion_candidates],
    ];

    return toCsv(headers, rows);
  };
}

function buildPromotionsCsv(filters: { department?: string; startDate?: string; endDate?: string }) {
  return async () => {
    const reportingData = applyReportingFilters(await loadReportingData(), filters);
    const candidates = computePromotionCandidates(reportingData);

    const headers = [
      'Lecturer ID',
      'Lecturer Name',
      'Department',
      'Rank',
      'Total Score',
      'Category',
      'Appraisal Date',
      'Recommendation',
    ];

    const rows = candidates.map((candidate) => [
      candidate.lecturer_id,
      candidate.lecturer_name,
      candidate.department,
      candidate.rank,
      candidate.total_score,
      candidate.category,
      candidate.appraisal_date,
      candidate.recommendation,
    ]);

    return toCsv(headers, rows);
  };
}

function buildAnalyticsCsv(filters: { department?: string; startDate?: string; endDate?: string }, session: AuthSession) {
  return async () => {
    const analytics = await loadPromotionAnalytics(filters, {
      role: session.role,
      department: session.department,
    });

    return promotionAnalyticsToCsv(analytics);
  };
}
function buildAuditCsv(filters: {
  actor?: string;
  action?: string;
  text?: string;
  startDate?: string;
  endDate?: string;
}) {
  return async () => {
    const actor = (filters.actor || '').trim();
    const action = (filters.action || '').trim();
    const text = (filters.text || '').trim();
    const startDate = (filters.startDate || '').trim();
    const endDate = (filters.endDate || '').trim();

    const where: Prisma.AuditLogWhereInput = {};

    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }

    if (actor) {
      where.actor = {
        OR: [
          { name: { contains: actor, mode: 'insensitive' } },
          { email: { contains: actor, mode: 'insensitive' } },
        ],
      };
    }

    if (text) {
      where.OR = [
        { action: { contains: text, mode: 'insensitive' } },
        { entityType: { contains: text, mode: 'insensitive' } },
        { entityId: { contains: text, mode: 'insensitive' } },
        { description: { contains: text, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        const minDate = new Date(startDate);
        if (!Number.isNaN(minDate.getTime())) where.createdAt.gte = minDate;
      }
      if (endDate) {
        const maxDate = new Date(endDate);
        if (!Number.isNaN(maxDate.getTime())) {
          maxDate.setHours(23, 59, 59, 999);
          where.createdAt.lte = maxDate;
        }
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: { actor: true },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const headers = ['Timestamp', 'Action', 'Actor', 'Entity Type', 'Entity ID', 'IP', 'Description', 'Metadata'];
    const rows = logs.map((log) => [
      log.createdAt.toISOString(),
      log.action,
      log.actor ? `${log.actor.name} (${log.actor.email})` : 'System',
      log.entityType,
      log.entityId,
      log.ipAddress,
      log.description,
      log.metadata ? JSON.stringify(log.metadata) : '',
    ]);

    return toCsv(headers, rows);
  };
}

export async function GET(request: NextRequest) {
  const session = getAuthSession(request);
  const type = (request.nextUrl.searchParams.get('type') || 'dashboard') as ExportType;
  const format = (request.nextUrl.searchParams.get('format') || 'csv') as ExportFormat;

  if (!session || session.legacy) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const allowedRoles = type === 'analytics'
    ? ['HOD_DEAN', 'HR_ADMIN', 'COMMITTEE_REVIEWER', 'SYSTEM_ADMIN']
    : ['HR_ADMIN', 'SYSTEM_ADMIN'];

  if (!allowedRoles.includes(session.role)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const department = request.nextUrl.searchParams.get('department') || '';
  const actor = request.nextUrl.searchParams.get('actor') || '';
  const action = request.nextUrl.searchParams.get('action') || '';
  const text = request.nextUrl.searchParams.get('text') || '';
  const startDate = request.nextUrl.searchParams.get('startDate') || '';
  const endDate = request.nextUrl.searchParams.get('endDate') || '';

  const filters = { department, actor, action, text, startDate, endDate };

  const builders: Record<ExportType, () => Promise<string>> = {
    dashboard: buildDashboardCsv(filters),
    promotions: buildPromotionsCsv(filters),
    analytics: buildAnalyticsCsv(filters, session),
    audit: buildAuditCsv(filters),
  };

  if (!builders[type]) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid report type. Use dashboard, promotions, analytics, or audit.',
      },
      { status: 400 }
    );
  }

  if (!['csv', 'pdf'].includes(format)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid report format. Use csv or pdf.',
      },
      { status: 400 }
    );
  }

  try {
    const csv = await builders[type]();
    const timestamp = new Date().toISOString().slice(0, 10);

    await writeAuditLog(prisma, {
      actorId: session.userId,
      action: 'REPORT_EXPORTED',
      entityType: 'Report',
      entityId: `${type}:${format}`,
      description: `${type} report exported as ${format}.`,
      metadata: {
        type,
        format,
        filters,
      },
    });

    if (format === 'pdf') {
      const lines = csv.split('\n').filter(Boolean);
      const headers = (lines[0] || '').split(',');
      const rows = lines.slice(1).map((line) => line.split(','));
      const pdfBytes = await toPdf(`${type.toUpperCase()} REPORT`, headers, rows);
      const pdfBuffer = Buffer.from(pdfBytes);

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${type}-report-${timestamp}.pdf"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${type}-report-${timestamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate report export',
      },
      { status: 500 }
    );
  }
}
