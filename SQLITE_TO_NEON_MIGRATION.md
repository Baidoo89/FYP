# SQLite to Neon Migration Checklist

Use this checklist to move your current SQLite data (`prisma/dev.db`) to Neon PostgreSQL safely.

## 1. Prepare Neon

1. Create a Neon project and database.
2. Copy the Neon connection string (must include `sslmode=require`).
3. Set production env vars:
   - `DATABASE_URL=<your-neon-connection-string>`

## 2. Backup Current SQLite Data

1. Stop the app.
2. Copy `prisma/dev.db` to a safe backup location.
3. Export key tables for rollback reference (optional):
   - `users`
   - `promotion_requests`
   - `documents`
   - `audit_logs`
   - `admin_accounts`

## 3. Apply Prisma Schema to Neon

Run from project root:

```bash
npx prisma generate --schema prisma/schema.postgres.prisma
npx prisma migrate deploy --schema prisma/schema.postgres.prisma
```

If migrations are not present/compatible for this environment, use:

```bash
npx prisma db push --schema prisma/schema.postgres.prisma
```

## 4. Move Existing Data (One-Time)

Preferred approach:
1. Use a one-time script that reads SQLite rows and writes them to Neon using Prisma.
2. Migrate in dependency order:
   - `admin_accounts`
   - `users`
   - `promotion_requests`
   - `documents`
   - `audit_logs`
3. Validate row counts before and after.

Quick checks:
- User count matches.
- Request count matches.
- Document verification statuses preserved.
- Recent audit logs preserved.

## 5. Verify App on Neon

1. Start app with Neon env values.
2. Log in as HR admin and lecturer.
3. Verify:
   - Dashboard data loads.
   - Evidence upload metadata saves.
   - Verification updates request status.
   - Promotions/appraisals pages load with real data.

## 6. Production Deployment

Use deploy script:

```bash
npm run deploy:prod
```

Recommended one-command cutover (includes preflight + connectivity + migrate + build + post-check):

```bash
npm run cutover:prod
```

Preflight only (no migrate/build):

```bash
npm run cutover:prod:check
```

Then start:

```bash
npm run start
```

## 7. Rollback Plan

If any critical issue occurs:
1. Revert `DATABASE_PROVIDER` and `DATABASE_URL` to previous values.
2. Restart app.
3. Restore from backup and investigate before retrying migration.

## Notes

- Do not run SQLite and Neon writes in parallel for production traffic.
- Freeze writes during final cutover window to avoid data drift.
- Keep SQLite backup until Neon is stable for several days.
