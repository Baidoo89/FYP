// ============================================================
// FINAL VERSION (PostgreSQL + lowercase tables + debug enabled)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getRows, insert } from '../../../lib/db';
import type { Lecturer, ApiResponse } from '../../../types';

/**
 * GET /api/lecturers
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const department = searchParams.get('department');
    const isActive = searchParams.get('active');

    let sql = 'SELECT * FROM lecturers';
    const params: any[] = [];

    const conditions: string[] = [];

    // ✅ PostgreSQL placeholders
    if (department) {
      conditions.push(`department = $${params.length + 1}`);
      params.push(department);
    }

    if (isActive !== null) {
      conditions.push(`is_active = $${params.length + 1}`);
      params.push(isActive === 'true');
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const lecturers = await getRows(sql, params);

    return NextResponse.json({
      success: true,
      data: lecturers,
    } as ApiResponse<Lecturer[]>);

  } catch (error: any) {
    console.error('❌ GET lecturers error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch lecturers',
        debug: {
          message: error.message,
          code: error.code,
          detail: error.detail,
          hint: error.hint,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lecturers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Lecturer;

    console.log('📥 Incoming lecturer:', body);

    // ✅ Validation
    if (!body.name || !body.email || !body.department || !body.rank) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, email, department, rank',
        },
        { status: 400 }
      );
    }

    // ✅ Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    // ✅ INSERT
    const lecturer_id = await insert('lecturers', {
      name: body.name,
      email: body.email,
      department: body.department,
      rank: body.rank,
      hire_date: body.hire_date ? new Date(body.hire_date) : null,
      is_active: body.is_active !== false,
      updated_at: new Date(), // REQUIRED
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Lecturer created successfully',
        data: { id: lecturer_id, ...body },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('❌ POST lecturers error:', error);

    // ✅ Duplicate email (PostgreSQL)
    if (error.code === '23505') {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already exists',
          debug: error.detail || error.message,
        },
        { status: 409 }
      );
    }

    // 🔥 FULL DEBUG RESPONSE
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create lecturer',
        debug: {
          message: error.message,
          code: error.code,
          detail: error.detail,
          hint: error.hint,
        },
      },
      { status: 500 }
    );
  }
}