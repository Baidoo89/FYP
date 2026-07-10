# Setup & Deployment Guide

## Local Development
1. Clone the repo
2. Create `.env.local` with your Neon `DATABASE_URL`
3. Run `npm install`
4. Run `npm run db:reset:dev -- --schema=prisma/schema.postgres.prisma`
5. Run `npm run dev`

## Production Deployment
- Set all secrets (especially `DATABASE_URL`) as environment variables in your deployment platform
- Push to `main` to trigger deployment (if using Vercel/Railway)
- Never commit `.env.local` to the repo