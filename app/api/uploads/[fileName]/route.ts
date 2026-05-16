import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../../../../lib/prisma';
import { getAuthSession } from '../../../../lib/auth';
import { PROMOTION_UPLOAD_DIR } from '../../../../lib/upload';

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
  const isHrAdmin = session.role === 'HR_ADMIN';

  if (!isOwner && !isHrAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const absolutePath = path.join(PROMOTION_UPLOAD_DIR, fileName);

  try {
    const fileBuffer = await fs.readFile(absolutePath);
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': documentRecord.mimeType,
        'Content-Disposition': `inline; filename="${documentRecord.fileName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'File unavailable' }, { status: 404 });
  }
}
