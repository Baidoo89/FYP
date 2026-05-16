import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getAuthSession } from '../../../../lib/auth';
import { createSecureFileName, MAX_PROMOTION_PDF_SIZE, saveMockPdfFile } from '../../../../lib/upload';
import { documentUploadSchema } from '../../../../lib/validation/promotion-request.schema';
import { writePromotionAudit } from '../../../../lib/promotion-audit';

function inferTargetRank(currentRank?: string | null) {
  const rank = String(currentRank || 'LECTURER').toUpperCase();

  if (rank === 'ASSISTANT_LECTURER') return 'LECTURER';
  if (rank === 'LECTURER') return 'SENIOR_LECTURER';
  if (rank === 'SENIOR_LECTURER') return 'ASSOCIATE_PROFESSOR';
  return 'ASSOCIATE_PROFESSOR';
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

    const documents = await prisma.document.findMany({
      where: {
        request: {
          lecturerId: session.userId,
        },
      },
      select: {
        id: true,
        category: true,
        title: true,
        fileUrl: true,
        verificationStatus: true,
        uploadedAt: true,
        fileSize: true,
      },
      orderBy: { uploadedAt: 'desc' },
    });

    const formattedDocuments = documents.map((doc) => ({
      ...doc,
      size: doc.fileSize,
    }));

    // Group by category
    const grouped = {
      RESEARCH: formattedDocuments.filter(d => d.category === 'RESEARCH'),
      TEACHING: formattedDocuments.filter(d => d.category === 'TEACHING'),
      SERVICE: formattedDocuments.filter(d => d.category === 'SERVICE'),
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          documents: formattedDocuments,
          grouped,
          stats: {
            totalDocuments: formattedDocuments.length,
            verifiedCount: formattedDocuments.filter(d => d.verificationStatus === 'VERIFIED').length,
            pendingCount: formattedDocuments.filter(d => d.verificationStatus === 'PENDING').length,
            rejectedCount: formattedDocuments.filter(d => d.verificationStatus === 'REJECTED').length,
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

    let draftRequest = await prisma.promotionRequest.findFirst({
      where: {
        lecturerId: session.userId,
        status: 'DRAFT',
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!draftRequest) {
      const currentRank = String(user.currentRank || 'LECTURER');
      draftRequest = await prisma.promotionRequest.create({
        data: {
          lecturerId: session.userId,
          requestedById: session.userId,
          status: 'DRAFT',
          currentRank,
          targetRank: inferTargetRank(user.currentRank),
        },
      });
    }

    const fileName = createSecureFileName(file.name || `${title}.pdf`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await saveMockPdfFile(fileName, buffer);

    const documentRecord = await prisma.document.upsert({
      where: {
        requestId_category: {
          requestId: draftRequest.id,
          category: parsed.data.category,
        },
      },
      update: {
        title: parsed.data.title,
        fileUrl: `/api/uploads/${encodeURIComponent(fileName)}`,
        fileName,
        mimeType: file.type,
        fileSize: file.size,
        verificationStatus: 'PENDING',
        verifiedById: null,
        verificationComment: null,
      },
      create: {
        requestId: draftRequest.id,
        category: parsed.data.category,
        title: parsed.data.title,
        fileUrl: `/api/uploads/${encodeURIComponent(fileName)}`,
        fileName,
        mimeType: file.type,
        fileSize: file.size,
      },
    });

    await prisma.$transaction(async (tx) => {
      await writePromotionAudit(tx, {
        requestId: draftRequest.id,
        actorId: session.userId,
        action: 'promotion_document.upload',
        metadata: {
          documentId: documentRecord.id,
          category: documentRecord.category,
          title: documentRecord.title,
          fileName: documentRecord.fileName,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Evidence uploaded successfully',
        data: {
          requestId: draftRequest.id,
          document: {
            id: documentRecord.id,
            category: documentRecord.category,
            title: documentRecord.title,
            fileUrl: documentRecord.fileUrl,
            verificationStatus: documentRecord.verificationStatus,
            uploadedAt: documentRecord.uploadedAt,
            size: documentRecord.fileSize,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Evidence upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload evidence' },
      { status: 500 }
    );
  }
}
