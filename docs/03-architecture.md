# System Architecture

- **Frontend:** Next.js 15.x (App Router), React 18, TypeScript
- **Backend:** Node.js, Next.js API routes
- **ORM:** Prisma v6.19.3 (PostgreSQL)
- **Database:** Neon (PostgreSQL, cloud-hosted)
- **Deployment:** Vercel, Railway, or custom server

## Architecture Diagram

```
[User] <-> [Next.js Frontend] <-> [API Routes] <-> [Prisma ORM] <-> [Neon Postgres]
```

- All environments use the same schema and migration workflow for consistency.