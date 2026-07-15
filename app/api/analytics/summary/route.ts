import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '../../../../types';
import { getAuthSession } from '../../../../lib/auth';
import { loadPromotionAnalytics, type PromotionAnalyticsSummary } from '../../../../lib/promotion-analytics';

const ANALYTICS_ROLES = ['HOD_DEAN', 'HR_ADMIN', 'COMMITTEE_REVIEWER', 'SYSTEM_ADMIN'];

export async function GET(request: NextRequest) {
  try {
    const session = getAuthSession(request);

    if (!session || session.legacy) {
      return NextResponse.json({ success: false, error: 'Unauthorized' } as ApiResponse<null>, { status: 401 });
    }

    if (!ANALYTICS_ROLES.includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' } as ApiResponse<null>, { status: 403 });
    }

    const department = request.nextUrl.searchParams.get('department') || '';
    const startDate = request.nextUrl.searchParams.get('startDate') || '';
    const endDate = request.nextUrl.searchParams.get('endDate') || '';

    const summary = await loadPromotionAnalytics(
      {
        department,
        startDate,
        endDate,
      },
      {
        role: session.role,
        department: session.department,
      }
    );

    return NextResponse.json({
      success: true,
      data: summary,
    } as ApiResponse<PromotionAnalyticsSummary>);
  } catch (error) {
    console.error('Failed to load promotion analytics summary', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load promotion analytics summary',
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
