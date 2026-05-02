import { NextResponse } from 'next/server';
import type { ApiResponse } from '../../../../types';
import { computePromotionCandidates, loadReportingData } from '../../../../lib/reporting';

export async function GET() {
  try {
    const data = await loadReportingData();
    const candidates = computePromotionCandidates(data);

    return NextResponse.json({
      success: true,
      data: candidates,
    } as ApiResponse<typeof candidates>);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load promotion candidates',
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
