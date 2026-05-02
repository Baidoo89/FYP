import { NextResponse } from 'next/server';
import type { ApiResponse, PerformanceMetrics } from '../../../../types';
import { computeDashboardMetrics, loadReportingData } from '../../../../lib/reporting';

export async function GET() {
  try {
    const data = await loadReportingData();
    const metrics = computeDashboardMetrics(data);

    return NextResponse.json({
      success: true,
      data: metrics,
    } as ApiResponse<PerformanceMetrics>);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load dashboard metrics',
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
