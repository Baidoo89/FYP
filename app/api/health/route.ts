import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    const [users, faculties, departments, criteria] = await Promise.all([
      prisma.user.count(),
      prisma.faculty.count(),
      prisma.department.count(),
      prisma.promotionCriteria.count({ where: { isActive: true } }),
    ]);

    return NextResponse.json({
      success: true,
      status: 'healthy',
      service: 'GCTU Promotion System',
      database: 'connected',
      checks: {
        users,
        faculties,
        departments,
        activeCriteria: criteria,
      },
      elapsedMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        service: 'GCTU Promotion System',
        database: 'unavailable',
        error: error instanceof Error ? error.message : 'Unknown health check error',
        elapsedMs: Date.now() - startedAt,
        checkedAt: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
