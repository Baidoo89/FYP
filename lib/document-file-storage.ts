type RawDatabaseClient = {
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>;
  $queryRawUnsafe: <T = unknown>(query: string, ...values: unknown[]) => Promise<T>;
};

type DocumentFileInput = {
  documentId: number;
  fileName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
};

export type StoredDocumentFile = {
  fileName: string;
  mimeType: string;
  size: number;
  data: Buffer;
};

export async function saveDocumentFileBlob(client: RawDatabaseClient, input: DocumentFileInput) {
  await client.$executeRawUnsafe(
    `
      INSERT INTO "document_file_blobs" ("documentId", "fileName", "mimeType", "size", "data")
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT ("documentId") DO UPDATE SET
        "fileName" = EXCLUDED."fileName",
        "mimeType" = EXCLUDED."mimeType",
        "size" = EXCLUDED."size",
        "data" = EXCLUDED."data",
        "updatedAt" = CURRENT_TIMESTAMP
    `,
    input.documentId,
    input.fileName,
    input.mimeType,
    input.size,
    input.buffer
  );
}

export async function getDocumentFileBlob(client: RawDatabaseClient, documentId: number) {
  const rows = await client.$queryRawUnsafe<StoredDocumentFile[]>(
    `
      SELECT "fileName", "mimeType", "size", "data"
      FROM "document_file_blobs"
      WHERE "documentId" = $1
      LIMIT 1
    `,
    documentId
  );

  return rows[0] || null;
}
