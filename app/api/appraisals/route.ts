import { NextRequest, NextResponse } from 'next/server';
import { getRow, getRows, insert, update } from '../../../lib/db';
import { computeAppraisalMetrics } from '../../../lib/calculations';
import { appendAuditLog } from '../../../lib/audit';
import { appraisalSchema } from '../../../lib/validation/appraisal.schema';
import type { ApiResponse } from '../../../types';

type AppraisalWithLecturer = {
  id: number;
  lecturer_id: number;
  lecturer_name: string;
  department: string;
  rank: string;
  teaching_score: number;
  research_score: number;
  service_score: number;
  total_score: number;
  category: 'Excellent' | 'Good' | 'Average' | 'Poor';
  is_promotion_recommended: boolean;
  appraisal_date: string;
  reviewed_by?: string;
  comments?: string;
  created_at?: string;
  updated_at?: string;
};

function buildAppraisalPayload(data: {
  lecturer_id: number;
  teaching_score: number;
  research_score: number;
  service_score: number;
  appraisal_date?: string;
  reviewed_by?: string | null;
  comments?: string | null;
}) {
  const metrics = computeAppraisalMetrics(
    data.teaching_score,
    data.research_score,
    data.service_score
  );

  return {
    lecturer_id: data.lecturer_id,
    teaching_score: data.teaching_score,
    research_score: data.research_score,
    service_score: data.service_score,
    total_score: metrics.total_score,
    category: metrics.category,
    is_promotion_recommended: metrics.is_promotion_recommended,
    appraisal_date: data.appraisal_date || new Date().toISOString().slice(0, 10),
    reviewed_by: data.reviewed_by ?? null,
    comments: data.comments ?? null,
  };
}

async function getAppraisalByLecturerId(lecturerId: number) {
  return getRow(
    `
      SELECT
        a.id,
        a.lecturer_id,
        l.name AS lecturer_name,
        l.department,
        l.rank,
        a.teaching_score,
        a.research_score,
        a.service_score,
        a.total_score,
        a.category,
        a.is_promotion_recommended,
        a.appraisal_date,
        a.reviewed_by,
        a.comments,
        a.created_at,
        a.updated_at
      FROM appraisals a
      JOIN lecturers l ON l.id = a.lecturer_id
      WHERE a.lecturer_id = $1
      LIMIT 1
    `,
    [lecturerId]
  );
}

// ================= GET =================
export async function GET(request: NextRequest) {
  try {
    const lecturerIdParam = request.nextUrl.searchParams.get('lecturer_id');

    if (lecturerIdParam) {
      const lecturerId = Number(lecturerIdParam);

      if (!Number.isInteger(lecturerId) || lecturerId <= 0) {
        return NextResponse.json({
          success: false,
          error: 'lecturer_id must be a positive number',
        }, { status: 400 });
      }

      const appraisal = await getAppraisalByLecturerId(lecturerId);

      return NextResponse.json({
        success: true,
        data: appraisal,
      } as ApiResponse<AppraisalWithLecturer | null>);
    }

    const appraisals = await getRows(`
      SELECT
        a.id,
        a.lecturer_id,
        l.name AS lecturer_name,
        l.department,
        l.rank,
        a.teaching_score,
        a.research_score,
        a.service_score,
        a.total_score,
        a.category,
        a.is_promotion_recommended,
        a.appraisal_date,
        a.reviewed_by,
        a.comments,
        a.created_at,
        a.updated_at
      FROM appraisals a
      JOIN lecturers l ON l.id = a.lecturer_id
      ORDER BY a.appraisal_date DESC, a.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      data: appraisals,
    } as ApiResponse<AppraisalWithLecturer[]>);

  } catch (error: any) {
    console.error("❌ GET appraisals error:", error);

    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
    }, { status: 500 });
  }
}

// ================= POST =================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ✅ SAFE NORMALIZATION (prevent NaN issues)
    const normalizedData = {
      lecturer_id: Number(body.lecturer_id),
      teaching_score: Number(body.teaching_score),
      research_score: Number(body.research_score),
      service_score: Number(body.service_score),
      appraisal_date: body.appraisal_date,
      reviewed_by: body.reviewed_by,
      comments: body.comments,
    };

    // ❗ HARD GUARD (VERY IMPORTANT)
    if (
      !normalizedData.lecturer_id ||
      Number.isNaN(normalizedData.lecturer_id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "lecturer_id is required and must be a valid number",
        },
        { status: 400 }
      );
    }

    // 🔥 ZOD VALIDATION
    const parsed = appraisalSchema.safeParse(normalizedData);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const lecturer = await getRow(
      'SELECT * FROM lecturers WHERE id = $1',
      [data.lecturer_id]
    );

    if (!lecturer) {
      return NextResponse.json(
        { success: false, error: 'Lecturer not found' },
        { status: 404 }
      );
    }

    const payload = buildAppraisalPayload(data);
    const existingAppraisal = await getAppraisalByLecturerId(data.lecturer_id);

    let id = existingAppraisal?.id;

    if (existingAppraisal?.id) {
      await update('appraisals', payload, 'id = $11', [existingAppraisal.id]);
    } else {
      id = await insert('appraisals', payload);
    }

    await appendAuditLog({
      action: existingAppraisal?.id ? 'appraisal.update' : 'appraisal.create',
      details: payload,
      request,
    });

    return NextResponse.json({
      success: true,
      message: existingAppraisal?.id ? 'Appraisal updated successfully' : 'Appraisal created successfully',
      data: { id, ...payload },
    }, { status: existingAppraisal?.id ? 200 : 201 });

  } catch (error: any) {
    console.error("❌ POST appraisal error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
      },
      { status: 500 }
    );
  }
}