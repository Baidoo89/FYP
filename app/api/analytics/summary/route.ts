import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '../../../../types';
import {
  applyReportingFilters,
  computeAnalyticsSummary,
  loadReportingData,
} from '../../../../lib/reporting';

export async function GET(request: NextRequest) {
  try {
    const department = request.nextUrl.searchParams.get('department') || '';
    const startDate = request.nextUrl.searchParams.get('startDate') || '';
    const endDate = request.nextUrl.searchParams.get('endDate') || '';

    const data = await loadReportingData();
    const filteredData = applyReportingFilters(data, {
      department,
      startDate,
      endDate,
    });

    const summary = computeAnalyticsSummary(filteredData);

    return NextResponse.json({
      success: true,
      data: {
        ...summary,
        filters: {
          department,
          startDate,
          endDate,
        },
      },
    } as ApiResponse<typeof summary>);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load analytics summary',
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
