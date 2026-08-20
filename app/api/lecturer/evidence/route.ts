import { NextRequest, NextResponse } from 'next/server';
import { DocumentCategory, RequestStatus } from '@prisma/client';
import { WORKFLOW_TRANSACTION_OPTIONS, prisma } from '../../../../lib/prisma';
import { getAuthSession } from '../../../../lib/auth';
import { createSecureFileName, isPdfUpload, MAX_PROMOTION_PDF_SIZE, savePdfFileBestEffort } from '../../../../lib/upload';
import { documentUploadSchema } from '../../../../lib/validation/promotion-request.schema';
import { savePromotionDocumentRecord, WorkflowError } from '../../../../lib/promotion-workflow';
import { REQUIRED_CATEGORIES } from '../../../../lib/promotion-engine';
import { saveDocumentFileBlob } from '../../../../lib/document-file-storage';

const ALL_CATEGORIES = Object.values(DocumentCategory);

function normalizeRank(rank?: string | null) {
  return String(rank || 'LECTURER').trim().toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');
}

function emptyGrouped() {
  return ALL_CATEGORIES.reduce<Record<DocumentCategory, any[]>>((grouped, category) => {
    grouped[category] = [];
    return grouped;
  }, {} as Record<DocumentCategory, any[]>);
}


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
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const session = getAuthSession(request);

    if (!session?.userId || !['STAFF', 'LECTURER'].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        currentRank: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Lecturer account not found' },
        { status: 404 }
      );
    }

    const activeRequest = await prisma.promotionRequest.findFirst({
      where: {
        lecturerId: session.userId,
        status: {
          notIn: [RequestStatus.COMPLETED, RequestStatus.REJECTED, RequestStatus.NOT_RECOMMENDED],
        },
      },
      select: {
        id: true,
        currentRank: true,
        targetRank: true,
        yearsInCurrentRank: true,
        status: true,
        eligibilityStatus: true,
        eligibilityReason: true,
        totalScore: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const currentRank = activeRequest?.currentRank || String(user.currentRank || '');
    const targetRank = activeRequest?.targetRank || null;

    const criteria = activeRequest && targetRank
      ? await prisma.promotionCriteria.findFirst({
          where: {
            currentRank: normalizeRank(currentRank) as any,
            targetRank: normalizeRank(targetRank) as any,
            isActive: true,
          },
          select: {
            requiredDocumentCategories: true,
            minimumYearsInCurrentRank: true,
            minimumTotalScore: true,
            publicationRequirement: true,
            professionalDevelopmentRequirement: true,
          },
        })
      : null;

    const requiredCategories = activeRequest
      ? criteria?.requiredDocumentCategories?.length
        ? criteria.requiredDocumentCategories
        : [...REQUIRED_CATEGORIES]
      : [];

    const documents = await prisma.document.findMany({
      where: activeRequest ? { requestId: activeRequest.id } : { id: -1 },
      select: {
        id: true,
        category: true,
        title: true,
        fileUrl: true,
        fileName: true,
        mimeType: true,
        verificationStatus: true,
        verificationComment: true,
        uploadedAt: true,
        fileSize: true,
        verifiedAt: true,
        verifiedBy: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    const formattedDocuments = documents.map((doc) => ({
      ...doc,
      size: doc.fileSize,
      required: requiredCategories.includes(doc.category),
    }));

    const grouped = emptyGrouped();
    for (const document of formattedDocuments) {
      grouped[document.category].push(document);
    }

    const categoryStatus = ALL_CATEGORIES.map((category) => {
      const categoryDocuments = grouped[category];
      const latest = categoryDocuments[0] || null;
      return {
        category,
        required: requiredCategories.includes(category),
        uploaded: categoryDocuments.length > 0,
        status: latest?.verificationStatus || 'MISSING',
        document: latest,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          request: activeRequest,
          lecturer: user,
          currentRank,
          targetRank,
          criteria,
          categories: ALL_CATEGORIES,
          requiredCategories,
          categoryStatus,
          documents: formattedDocuments,
          grouped,
          stats: {
            totalDocuments: formattedDocuments.length,
            requiredCategories: requiredCategories.length,
            requiredUploadedCount: requiredCategories.filter((category) => grouped[category].length > 0).length,
            requiredVerifiedCount: requiredCategories.filter((category) => grouped[category].some((document) => document.verificationStatus === 'VERIFIED')).length,
            verifiedCount: formattedDocuments.filter((document) => document.verificationStatus === 'VERIFIED').length,
            pendingCount: formattedDocuments.filter((document) => document.verificationStatus === 'PENDING').length,
            returnedCount: formattedDocuments.filter((document) => document.verificationStatus === 'REQUIRES_CORRECTION').length,
            rejectedCount: formattedDocuments.filter((document) => document.verificationStatus === 'REJECTED').length,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Evidence fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load evidence data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getAuthSession(request);

    if (!session?.userId || !['STAFF', 'LECTURER'].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const category = normalizeDocumentCategory(formData.get('category'));
    const file = formData.get('file');
    const title = titleFromUpload(formData.get('title'), file, category);

    const parsed = documentUploadSchema.safeParse({
      requestId: 1,
      category,
      title,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: documentValidationMessage(parsed.error.flatten().fieldErrors),
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    if (!isUploadedFile(file)) {
      return NextResponse.json(
        { success: false, error: 'PDF file is required' },
        { status: 400 }
      );
    }

    if (file.size > MAX_PROMOTION_PDF_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    const activeRequest = await prisma.promotionRequest.findFirst({
      where: {
        lecturerId: session.userId,
        status: {
          notIn: [RequestStatus.COMPLETED, RequestStatus.REJECTED, RequestStatus.NOT_RECOMMENDED],
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!activeRequest) {
      return NextResponse.json(
        { success: false, error: 'Start a promotion application and select the rank you are applying for before uploading evidence.' },
        { status: 409 }
      );
    }

    const fileName = createSecureFileName(file.name || `${title}.pdf`);
    const buffer = Buffer.from(await file.arrayBuffer());

    if (!isPdfUpload(file.name || `${title}.pdf`, file.type, buffer)) {
      return NextResponse.json(
        { success: false, error: 'Only valid PDF files are allowed' },
        { status: 400 }
      );
    }

    const mimeType = file.type || 'application/pdf';
    await savePdfFileBestEffort(fileName, buffer);

    const result = await prisma.$transaction(async (tx) => {
      const documentRecord = await savePromotionDocumentRecord(tx, {
        actor: {
          id: session.userId,
          role: session.role,
          name: session.name,
        },
        requestId: activeRequest.id,
        category: parsed.data.category as DocumentCategory,
        title: parsed.data.title,
        fileUrl: `/api/uploads/${encodeURIComponent(fileName)}`,
        fileName,
        fileType: mimeType,
        mimeType,
        fileSize: file.size,
      });

      await saveDocumentFileBlob(tx, {
        documentId: documentRecord.id,
        fileName,
        mimeType,
        size: file.size,
        buffer,
      });

      return {
        request: activeRequest,
        document: documentRecord,
      };
    }, WORKFLOW_TRANSACTION_OPTIONS);

    return NextResponse.json(
      {
        success: true,
        message: 'Evidence uploaded successfully',
        data: {
          requestId: result.request.id,
          document: {
            id: result.document.id,
            category: result.document.category,
            title: result.document.title,
            fileUrl: result.document.fileUrl,
            verificationStatus: result.document.verificationStatus,
            uploadedAt: result.document.uploadedAt,
            size: result.document.fileSize,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Evidence upload error:', error);
    return workflowErrorResponse(error, 'Failed to upload evidence');
  }
}
