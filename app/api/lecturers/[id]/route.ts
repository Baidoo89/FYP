// ============================================================
// API Route: GET, PUT, DELETE specific lecturer
// Location: app/api/lecturers/[id]/route.ts
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getRow, update, deleteRecord } from '../../../../lib/db';
import type { Lecturer, ApiResponse } from '../../../../types';

/**
 * GET /api/lecturers/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lecturer = (await getRow('SELECT * FROM lecturers WHERE id = ?', [id])) as Lecturer | null;

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lecturer not found',
        } as ApiResponse<null>,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: lecturer as Lecturer,
    } as ApiResponse<Lecturer>);
  } catch (error) {
    console.error('Error fetching lecturer:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch lecturer',
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/lecturers/:id
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as Partial<Lecturer>;

    // Check if lecturer exists
    const lecturer = (await getRow('SELECT * FROM lecturers WHERE id = ?', [id])) as Lecturer | null;
    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lecturer not found',
        } as ApiResponse<null>,
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, any> = {};
    if (body.name) updateData.name = body.name;
    if (body.department) updateData.department = body.department;
    if (body.rank) updateData.rank = body.rank;
    if (body.hire_date) updateData.hire_date = body.hire_date;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    // Email is not allowed to be changed (unique constraint)
    if (body.email && body.email !== lecturer.email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email cannot be changed',
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    await update('lecturers', updateData, 'id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Lecturer updated successfully',
    } as ApiResponse<null>);
  } catch (error) {
    console.error('Error updating lecturer:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update lecturer',
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lecturers/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if lecturer exists
    const lecturer = (await getRow('SELECT * FROM lecturers WHERE id = ?', [id])) as Lecturer | null;
    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lecturer not found',
        } as ApiResponse<null>,
        { status: 404 }
      );
    }

    await deleteRecord('lecturers', 'id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Lecturer deleted successfully',
    } as ApiResponse<null>);
  } catch (error) {
    console.error('Error deleting lecturer:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete lecturer',
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
