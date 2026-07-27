import crypto from 'crypto';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

export const MAX_PROMOTION_PDF_SIZE = 10 * 1024 * 1024;
export const PROMOTION_UPLOAD_DIR = process.env.PROMOTION_UPLOAD_DIR || (
  process.env.VERCEL
    ? path.join(os.tmpdir(), 'gctu-promotion-uploads')
    : path.join(process.cwd(), 'storage', 'promotion-uploads')
);

export function sanitizeUploadName(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export function createSecureFileName(originalName: string) {
  // 8 hex characters (32 bits) is ample collision resistance for this volume of
  // uploads and keeps the storage filename shorter than a full UUID; actual
  // access control is enforced by the API route, not by name obscurity.
  const randomPart = crypto.randomBytes(4).toString('hex');
  const safeBaseName = sanitizeUploadName(path.parse(originalName).name) || 'document';
  return `${safeBaseName}-${randomPart}.pdf`;
}

export function hasPdfSignature(buffer: Buffer) {
  return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}

export function isPdfUpload(originalName: string | undefined, mimeType: string | undefined, buffer: Buffer) {
  const normalizedMime = String(mimeType || '').toLowerCase();
  const lowerName = String(originalName || '').toLowerCase();
  const mimeLooksPdf = normalizedMime === 'application/pdf' || normalizedMime === 'application/x-pdf' || normalizedMime === 'application/octet-stream' || normalizedMime === '';
  return mimeLooksPdf && lowerName.endsWith('.pdf') && hasPdfSignature(buffer);
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

export async function savePdfFileBestEffort(fileName: string, buffer: Buffer) {
  try {
    return await saveMockPdfFile(fileName, buffer);
  } catch (error) {
    console.warn('Local PDF cache unavailable:', error);
    return null;
  }
}
