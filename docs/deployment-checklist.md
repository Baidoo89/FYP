# Deployment Checklist

## Environment Variables

Required:

```text
DATABASE_URL=
AUTH_SECRET=
APP_URL=https://promotion.techdalt.com
NEXT_PUBLIC_APP_URL=https://promotion.techdalt.com
NEXT_PUBLIC_API_URL=https://promotion.techdalt.com
NODE_ENV=production
```

Email verification:

```text
EMAIL_PROVIDER=development
```

Production email delivery should replace `EMAIL_PROVIDER=development` with a real SMTP/provider configuration before live users register.

## Vercel + Cloudflare Subdomain

Production target subdomain:

```text
https://promotion.techdalt.com
```

Because `techdalt.com` is already in use, keep the existing apex/root DNS records unchanged. After adding `promotion.techdalt.com` to the Vercel project and checking Vercel's required records, add only this new Cloudflare record:

```text
Type: CNAME
Name: promotion
Value: Exact Vercel-provided CNAME for this project
Proxy: DNS only while Vercel verification is pending
```

If Vercel shows a different DNS value inside the project domain screen, use the exact value Vercel provides for `promotion.techdalt.com`.

In Vercel Project Settings -> Environment Variables, set `APP_URL`, `NEXT_PUBLIC_APP_URL`, and `NEXT_PUBLIC_API_URL` to `https://promotion.techdalt.com`, then redeploy so authentication emails use the public subdomain instead of localhost.

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
- Keep `APP_URL`, `NEXT_PUBLIC_APP_URL`, and `NEXT_PUBLIC_API_URL` aligned with the Vercel production subdomain.
- Configure a real email provider before live deployment.
- Restrict database credentials to the deployment environment.
