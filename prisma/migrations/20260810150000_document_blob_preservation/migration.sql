-- Manage durable promotion evidence storage through Prisma migrations.
-- IF NOT EXISTS preserves installations where the former runtime helper created it.
CREATE TABLE IF NOT EXISTS "document_file_blobs" (
    "documentId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_file_blobs_pkey" PRIMARY KEY ("documentId"),
    CONSTRAINT "document_file_blobs_documentId_fkey"
        FOREIGN KEY ("documentId") REFERENCES "documents"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "document_file_blobs_fileName_idx"
ON "document_file_blobs"("fileName");
