import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '../../../../types';
import { getAuthSession } from '../../../../lib/auth';
import { getDepartmentReviewScope } from '../../../../lib/department-scope';
import { prisma } from '../../../../lib/prisma';
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

    const departmentScope = session.role === 'HOD_DEAN'
      ? await getDepartmentReviewScope(prisma, {
          userId: session.userId,
          role: session.role,
          sessionDepartment: session.department,
        })
      : null;

    const summary = await loadPromotionAnalytics(
      {
        department,
        startDate,
        endDate,
      },
      {
        role: session.role,
        department: session.department,
        where: departmentScope?.where,
        scopeKind: departmentScope?.scopeKind || 'institution',
        scopeLabel: departmentScope?.scopeLabel,
        scopeDetail: departmentScope?.scopeDetail,
      }
    );

    return NextResponse.json({
      success: true,
      data: { ...summary, viewerRole: session.role },
    } as ApiResponse<PromotionAnalyticsSummary & { viewerRole: typeof session.role }>);
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
