import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getAuthSession } from '../../../../../lib/auth';
import { createSecureFileName, MAX_PROMOTION_PDF_SIZE, saveMockPdfFile } from '../../../../../lib/upload';
import { documentUploadSchema } from '../../../../../lib/validation/promotion-request.schema';
import { savePromotionDocumentRecord, WorkflowError } from '../../../../../lib/promotion-workflow';
import type { ApiResponse } from '../../../../../types';

function workflowErrorResponse(error: unknown, fallback: string) {
  const status = error instanceof WorkflowError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ success: false, error: message } as ApiResponse<null>, { status });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getAuthSession(request);
  const { id } = await context.params;
  const requestId = Number(id);

  if (!session || session.legacy) {
    return NextResponse.json({ success: false, error: 'Unauthorized' } as ApiResponse<null>, { status: 401 });
  }

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid request id' } as ApiResponse<null>, { status: 400 });
  }

  const formData = await request.formData();
  const title = String(formData.get('title') || '').trim();
  const category = String(formData.get('category') || '').trim();
  const file = formData.get('file');

  const parsed = documentUploadSchema.safeParse({
    requestId,
    category,
    title,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      } as ApiResponse<null>,
      { status: 400 }
    );
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'PDF file is required' } as ApiResponse<null>, { status: 400 });
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ success: false, error: 'Only PDF files are allowed' } as ApiResponse<null>, { status: 400 });
  }

  if (file.size > MAX_PROMOTION_PDF_SIZE) {
    return NextResponse.json({ success: false, error: 'File size exceeds 10MB limit' } as ApiResponse<null>, { status: 400 });
  }

  const fileName = createSecureFileName(file.name || `${title}.pdf`);
  const buffer = Buffer.from(await file.arrayBuffer());
  await saveMockPdfFile(fileName, buffer);

  try {
    const documentRecord = await prisma.$transaction((tx) =>
      savePromotionDocumentRecord(tx, {
        actor: {
          id: session.userId,
          role: session.role,
          name: session.name,
        },
        requestId,
        category: parsed.data.category,
        title: parsed.data.title,
        fileUrl: `/api/uploads/${encodeURIComponent(fileName)}`,
        fileName,
        mimeType: file.type,
        fileType: file.type,
        fileSize: file.size,
      })
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Document uploaded successfully',
        data: documentRecord,
      } as ApiResponse<typeof documentRecord>,
      { status: 201 }
    );
  } catch (error) {
    return workflowErrorResponse(error, 'Document upload failed');
  }
}
