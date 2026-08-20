import { NextRequest, NextResponse } from 'next/server';
import { WORKFLOW_TRANSACTION_OPTIONS, prisma } from '../../../../../lib/prisma';
import { getAuthSession } from '../../../../../lib/auth';
import { createSecureFileName, isPdfUpload, MAX_PROMOTION_PDF_SIZE, savePdfFileBestEffort } from '../../../../../lib/upload';
import { documentUploadSchema } from '../../../../../lib/validation/promotion-request.schema';
import { savePromotionDocumentRecord, WorkflowError } from '../../../../../lib/promotion-workflow';
import type { ApiResponse } from '../../../../../types';
import { saveDocumentFileBlob } from '../../../../../lib/document-file-storage';


type UploadedFileLike = {
  name?: string;
  type?: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'arrayBuffer' in value &&
    typeof (value as UploadedFileLike).arrayBuffer === 'function' &&
    'size' in value &&
    typeof (value as UploadedFileLike).size === 'number'
  );
}
function labelFromEnum(value: string) {
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function normalizeDocumentCategory(value: FormDataEntryValue | null) {
  return String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
}

function titleFromUpload(value: FormDataEntryValue | null, file: FormDataEntryValue | null, category: string) {
  const typedTitle = String(value || '').trim();
  if (typedTitle.length >= 2) return typedTitle;

  if (isUploadedFile(file) && file.name) {
    const titleFromFile = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
    if (titleFromFile.length >= 2) return titleFromFile;
  }

  return category ? `${labelFromEnum(category)} Evidence` : 'Promotion Evidence';
}

function documentValidationMessage(fieldErrors: Record<string, string[] | undefined>) {
  if (fieldErrors.requestId?.length) return 'Invalid promotion application selected.';
  if (fieldErrors.category?.length) return 'Choose a valid evidence category before uploading.';
  if (fieldErrors.title?.length) return fieldErrors.title[0] || 'Enter a valid document title.';
  return 'Please check the document details and try again.';
}
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
  const category = normalizeDocumentCategory(formData.get('category'));
  const file = formData.get('file');
  const title = titleFromUpload(formData.get('title'), file, category);

  const parsed = documentUploadSchema.safeParse({
    requestId,
    category,
    title,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: documentValidationMessage(parsed.error.flatten().fieldErrors),
        details: parsed.error.flatten().fieldErrors,
      } as ApiResponse<null>,
      { status: 400 }
    );
  }

  if (!isUploadedFile(file)) {
    return NextResponse.json({ success: false, error: 'PDF file is required' } as ApiResponse<null>, { status: 400 });
  }

  if (file.size > MAX_PROMOTION_PDF_SIZE) {
    return NextResponse.json({ success: false, error: 'File size exceeds 10MB limit' } as ApiResponse<null>, { status: 400 });
  }

  const fileName = createSecureFileName(file.name || `${title}.pdf`);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (!isPdfUpload(file.name || `${title}.pdf`, file.type, buffer)) {
    return NextResponse.json({ success: false, error: 'Only valid PDF files are allowed' } as ApiResponse<null>, { status: 400 });
  }

  const mimeType = file.type || 'application/pdf';

  try {
    await savePdfFileBestEffort(fileName, buffer);

    const documentRecord = await prisma.$transaction(async (tx) => {
      const savedDocument = await savePromotionDocumentRecord(tx, {
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
        mimeType,
        fileType: mimeType,
        fileSize: file.size,
      });

      await saveDocumentFileBlob(tx, {
        documentId: savedDocument.id,
        fileName,
        mimeType,
        size: file.size,
        buffer,
      });

      return savedDocument;
    }, WORKFLOW_TRANSACTION_OPTIONS);

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
