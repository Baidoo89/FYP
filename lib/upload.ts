import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export const MAX_PROMOTION_PDF_SIZE = 10 * 1024 * 1024;
export const PROMOTION_UPLOAD_DIR = path.join(process.cwd(), 'storage', 'promotion-uploads');

export function sanitizeUploadName(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export function createSecureFileName(originalName: string) {
  const randomPart = crypto.randomUUID().replace(/-/g, '');
  const safeBaseName = sanitizeUploadName(path.parse(originalName).name) || 'document';
  return `${safeBaseName}-${randomPart}.pdf`;
}

export async function ensurePromotionUploadDir() {
  await fs.mkdir(PROMOTION_UPLOAD_DIR, { recursive: true });
}

export async function saveMockPdfFile(fileName: string, buffer: Buffer) {
  await ensurePromotionUploadDir();
  const absolutePath = path.join(PROMOTION_UPLOAD_DIR, fileName);
  await fs.writeFile(absolutePath, buffer);
  return absolutePath;
}
