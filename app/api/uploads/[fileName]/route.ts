import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../../../../lib/prisma';
import { getAuthSession } from '../../../../lib/auth';
import { PROMOTION_UPLOAD_DIR, sanitizeUploadName } from '../../../../lib/upload';
import { getDocumentFileBlob } from '../../../../lib/document-file-storage';

function toArrayBuffer(buffer: Buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

function fileResponse(request: NextRequest, data: Buffer, contentType: string, downloadName: string) {
  const totalSize = data.byteLength;
  const rangeHeader = request.headers.get('range');
  const commonHeaders = {
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, no-store',
    'Content-Disposition': `inline; filename="${downloadName}"`,
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
  };

  if (!rangeHeader) {
    return new NextResponse(toArrayBuffer(data), {
      headers: {
        ...commonHeaders,
        'Content-Length': String(totalSize),
      },
    });
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match || (!match[1] && !match[2]) || totalSize === 0) {
    return new NextResponse(null, {
      status: 416,
      headers: { ...commonHeaders, 'Content-Range': `bytes */${totalSize}` },
    });
  }

  let start: number;
  let end: number;

  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
      return new NextResponse(null, {
        status: 416,
        headers: { ...commonHeaders, 'Content-Range': `bytes */${totalSize}` },
      });
    }
    start = Math.max(totalSize - suffixLength, 0);
    end = totalSize - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : totalSize - 1;
  }

  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= totalSize || end < start) {
    return new NextResponse(null, {
      status: 416,
      headers: { ...commonHeaders, 'Content-Range': `bytes */${totalSize}` },
    });
  }

  end = Math.min(end, totalSize - 1);
  const chunk = data.subarray(start, end + 1);

  return new NextResponse(toArrayBuffer(chunk), {
    status: 206,
    headers: {
      ...commonHeaders,
      'Content-Length': String(chunk.byteLength),
      'Content-Range': `bytes ${start}-${end}/${totalSize}`,
    },
  });
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
  const isWorkflowReviewer = ['HOD_DEAN', 'HR_ADMIN', 'COMMITTEE_REVIEWER'].includes(session.role);

  if (!isOwner && !isWorkflowReviewer) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const storedFile = await getDocumentFileBlob(prisma, documentRecord.id);

  // The stored fileName carries a random suffix for storage-safety; users should
  // never see that in a browser tab title or a downloaded file's name, so present
  // a clean name derived from the document's own title instead.
  const downloadName = `${sanitizeUploadName(documentRecord.title) || 'evidence-document'}.pdf`;

  if (storedFile) {
    return fileResponse(
      request,
      storedFile.data,
      storedFile.mimeType || documentRecord.mimeType || 'application/pdf',
      downloadName,
    );
  }

  const absolutePath = path.join(PROMOTION_UPLOAD_DIR, fileName);

  try {
    const fileBuffer = await fs.readFile(absolutePath);
    return fileResponse(request, fileBuffer, documentRecord.mimeType || 'application/pdf', downloadName);
  } catch {
    return NextResponse.json({ error: 'File unavailable' }, { status: 404 });
  }
}
