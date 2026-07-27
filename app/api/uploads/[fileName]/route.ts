import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../../../../lib/prisma';
import { getAuthSession } from '../../../../lib/auth';
import { PROMOTION_UPLOAD_DIR, sanitizeUploadName } from '../../../../lib/upload';
import { ensureDocumentFileStorage, getDocumentFileBlob } from '../../../../lib/document-file-storage';

function toArrayBuffer(buffer: Buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

export async function GET(request: NextRequest, context: { params: Promise<{ fileName: string }> }) {
  const session = getAuthSession(request);
  const { fileName } = await context.params;

  if (!session || session.legacy) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const documentRecord = await prisma.document.findFirst({
    where: { fileName },
    include: { request: true },
  });

  if (!documentRecord) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const isOwner = documentRecord.request.lecturerId === session.userId;
  const isWorkflowReviewer = ['HOD_DEAN', 'HR_ADMIN', 'COMMITTEE_REVIEWER', 'SYSTEM_ADMIN'].includes(session.role);

  if (!isOwner && !isWorkflowReviewer) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await ensureDocumentFileStorage(prisma);
  const storedFile = await getDocumentFileBlob(prisma, documentRecord.id);

  // The stored fileName carries a random suffix for storage-safety; users should
  // never see that in a browser tab title or a downloaded file's name, so present
  // a clean name derived from the document's own title instead.
  const downloadName = `${sanitizeUploadName(documentRecord.title) || 'evidence-document'}.pdf`;

  if (storedFile) {
    return new NextResponse(toArrayBuffer(storedFile.data), {
      headers: {
        'Content-Type': storedFile.mimeType || documentRecord.mimeType || 'application/pdf',
        'Content-Disposition': `inline; filename="${downloadName}"`,
        'Content-Length': String(storedFile.size || documentRecord.fileSize),
      },
    });
  }

  const absolutePath = path.join(PROMOTION_UPLOAD_DIR, fileName);

  try {
    const fileBuffer = await fs.readFile(absolutePath);
    return new NextResponse(toArrayBuffer(fileBuffer), {
      headers: {
        'Content-Type': documentRecord.mimeType || 'application/pdf',
        'Content-Disposition': `inline; filename="${downloadName}"`,
        'Content-Length': String(documentRecord.fileSize),
      },
    });
  } catch {
    return NextResponse.json({ error: 'File unavailable' }, { status: 404 });
  }
}
