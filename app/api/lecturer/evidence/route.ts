import { NextRequest, NextResponse } from 'next/server';
import { DocumentCategory, RequestStatus } from '@prisma/client';
import { prisma } from '../../../../lib/prisma';
import { getAuthSession } from '../../../../lib/auth';
import { createSecureFileName, MAX_PROMOTION_PDF_SIZE, saveMockPdfFile } from '../../../../lib/upload';
import { documentUploadSchema } from '../../../../lib/validation/promotion-request.schema';
import { createPromotionRequestWithWorkflow, savePromotionDocumentRecord, WorkflowError } from '../../../../lib/promotion-workflow';
import { REQUIRED_CATEGORIES } from '../../../../lib/promotion-engine';

const ALL_CATEGORIES = Object.values(DocumentCategory);

function inferTargetRank(currentRank?: string | null) {
  const rank = String(currentRank || 'LECTURER').toUpperCase();

  if (rank === 'ASSISTANT_LECTURER') return 'LECTURER';
  if (rank === 'LECTURER') return 'SENIOR_LECTURER';
  if (rank === 'SENIOR_LECTURER') return 'ASSOCIATE_PROFESSOR';
  return 'ASSOCIATE_PROFESSOR';
}

function normalizeRank(rank?: string | null) {
  return String(rank || 'LECTURER').trim().toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');
}

function emptyGrouped() {
  return ALL_CATEGORIES.reduce<Record<DocumentCategory, any[]>>((grouped, category) => {
    grouped[category] = [];
    return grouped;
  }, {} as Record<DocumentCategory, any[]>);
}

function workflowErrorResponse(error: unknown, fallback: string) {
  const status = error instanceof WorkflowError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const session = getAuthSession(request);

    if (!session?.userId || session.role !== 'LECTURER') {
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

    const currentRank = activeRequest?.currentRank || String(user.currentRank || 'LECTURER');
    const targetRank = activeRequest?.targetRank || inferTargetRank(user.currentRank);

    const criteria = await prisma.promotionCriteria.findFirst({
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
    });

    const requiredCategories = criteria?.requiredDocumentCategories?.length
      ? criteria.requiredDocumentCategories
      : [...REQUIRED_CATEGORIES];

    const documents = await prisma.document.findMany({
      where: activeRequest
        ? { requestId: activeRequest.id }
        : {
            request: {
              lecturerId: session.userId,
            },
          },
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

    if (!session?.userId || session.role !== 'LECTURER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const title = String(formData.get('title') || '').trim();
    const category = String(formData.get('category') || '').trim();
    const file = formData.get('file');

    const parsed = documentUploadSchema.safeParse({
      requestId: 1,
      category,
      title,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'PDF file is required' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    if (file.size > MAX_PROMOTION_PDF_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        currentRank: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Lecturer account not found' },
        { status: 404 }
      );
    }

    const fileName = createSecureFileName(file.name || `${title}.pdf`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await saveMockPdfFile(fileName, buffer);

    const result = await prisma.$transaction(async (tx) => {
      const activeRequest = await tx.promotionRequest.findFirst({
        where: {
          lecturerId: session.userId,
          status: {
            notIn: [RequestStatus.COMPLETED, RequestStatus.REJECTED, RequestStatus.NOT_RECOMMENDED],
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      const requestRecord = activeRequest || await createPromotionRequestWithWorkflow(tx, {
        actor: {
          id: session.userId,
          role: session.role,
          name: session.name,
        },
        lecturerId: session.userId,
        currentRank: String(user.currentRank || 'LECTURER'),
        targetRank: inferTargetRank(user.currentRank),
        yearsInCurrentRank: 0,
      });

      const documentRecord = await savePromotionDocumentRecord(tx, {
        actor: {
          id: session.userId,
          role: session.role,
          name: session.name,
        },
        requestId: requestRecord.id,
        category: parsed.data.category as DocumentCategory,
        title: parsed.data.title,
        fileUrl: `/api/uploads/${encodeURIComponent(fileName)}`,
        fileName,
        fileType: file.type,
        mimeType: file.type,
        fileSize: file.size,
      });

      return {
        request: requestRecord,
        document: documentRecord,
      };
    });

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
