# V2 Live Diff Review

Date: 10 August 2026

- The configured Neon database is reachable.
- Three V2 migrations remain unapplied: foundation, request links, and staff access foundation.
- The read-only Prisma diff identified an existing `document_file_blobs` table and foreign key that are not represented in the current Prisma schema.
- No migration deployment was performed because the unmodelled table requires ownership and retention review first.
- The V2 migration files themselves are intended to remain additive and must not drop `document_file_blobs`.
