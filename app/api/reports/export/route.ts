import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  applyReportingFilters,
  computeAnalyticsSummary,
  computeDashboardMetrics,
  computePromotionCandidates,
  loadReportingData,
} from '../../../../lib/reporting';
import { appendAuditLog, readRecentAuditLogs } from '../../../../lib/audit';

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

function buildAnalyticsCsv(filters: { department?: string; startDate?: string; endDate?: string }) {
  return async () => {
    const reportingData = applyReportingFilters(await loadReportingData(), filters);
    const analytics = computeAnalyticsSummary(reportingData);

    const headers = ['Department', 'Lecturers', 'Appraisals', 'Avg Total Score', 'Promotion Candidates'];
    const rows = analytics.departments.map((department) => [
      department.department,
      department.lecturers,
      department.appraisals,
      department.avg_total_score,
      department.promotion_candidates,
    ]);

    return toCsv(headers, rows);
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
    const logsAll = await readRecentAuditLogs();
    const logs = Array.isArray(logsAll) ? logsAll.slice(0, 1000) : [];
    const actor = (filters.actor || '').trim().toLowerCase();
    const action = (filters.action || '').trim().toLowerCase();
    const text = (filters.text || '').trim().toLowerCase();
    const startDate = (filters.startDate || '').trim();
    const endDate = (filters.endDate || '').trim();

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

    const headers = ['Timestamp', 'Action', 'Actor', 'IP', 'User Agent', 'Details'];
    const rows = filtered.map((log) => [
      log.timestamp,
      log.action,
      log.actor,
      log.ip,
      log.userAgent,
      log.details ? JSON.stringify(log.details) : '',
    ]);

    return toCsv(headers, rows);
  };
}

export async function GET(request: NextRequest) {
  const type = (request.nextUrl.searchParams.get('type') || 'dashboard') as ExportType;
  const format = (request.nextUrl.searchParams.get('format') || 'csv') as ExportFormat;
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
    analytics: buildAnalyticsCsv(filters),
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

    await appendAuditLog({
      action: 'report.export',
      details: {
        type,
        format,
        filters,
      },
      request,
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
