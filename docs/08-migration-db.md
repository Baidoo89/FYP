# Migration & Database Management

- All schema changes are managed via Prisma migrations
- Use `npm run db:reset:dev -- --schema=prisma/schema.postgres.prisma` to reset and sync the DB
- Always commit and push new migrations
- Prisma Client is regenerated after each migration