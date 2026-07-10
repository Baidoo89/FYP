# Deployment Checklist

## Environment Variables

Required:

```text
DATABASE_URL=
AUTH_SECRET=
NEXT_PUBLIC_API_URL=
NODE_ENV=production
```

Development email verification:

```text
EMAIL_PROVIDER=development
APP_URL=http://localhost:3000
```

Production email delivery should replace `EMAIL_PROVIDER=development` with a real provider configuration.

## Database

Run:

```bash
npx dotenv -e .env.local -- prisma db push --schema prisma/schema.prisma --accept-data-loss
npm run db:seed
npm run seed:demo
```

For controlled production migrations, replace `db push` with a reviewed Prisma migration workflow.

## Verification Commands

```bash
npm run smoke
npx tsc --noEmit
npx next build
```

## Health Check

Open:

```text
/api/health
```

Expected:

```json
{
  "success": true,
  "status": "healthy",
  "database": "connected"
}
```

## Pre-Demo Checklist

- Confirm `npm run smoke` passes.
- Run `npm run seed:demo` if you need a populated promotion application for demonstration.
- Confirm all demo users can log in.
- Confirm System Admin can manage users, structure, criteria, and settings.
- Confirm Lecturer can create request and upload evidence.
- Confirm HOD/Dean can forward or return applications.
- Confirm HR/Admin can verify documents and view eligibility recommendation.
- Confirm Committee Reviewer can submit recommendation.
- Confirm audit logs show the actions.
- Confirm reports export as CSV/PDF.

## Security Notes

- Use a strong `AUTH_SECRET`.
- Keep `.env.local` and production secrets out of Git.
- Use HTTPS in production.
- Configure a real email provider before live deployment.
- Restrict database credentials to the deployment environment.
