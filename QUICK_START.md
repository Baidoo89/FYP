# GCTU Promotion System - Quick Start

## 1. Prerequisites

- Node.js 18+
- npm 9+
- MySQL 8+ (optional for initial UI testing)

## 2. Database Setup

**See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed instructions.**

Quick version (if MySQL is already installed):

```bash
# PowerShell
Get-Content .\database\schema.sql | mysql -u root -p

# Command Prompt / Git Bash
mysql -u root -p < database/schema.sql
```

**Docker option available:** See DATABASE_SETUP.md for Docker Compose setup (recommended for reproducible FYP submission).

Verify:

```sql
USE lecturer_performance_db;
SHOW TABLES;
```

Expected tables:

- lecturers
- appraisals
- performance_trends
- promotion_history

## 3. Environment Configuration

Create local environment file:

```bash
# PowerShell
Copy-Item .env.local.example .env.local
```

Update `.env.local`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=lecturer_performance_db
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

Use a secure admin password for real deployment.

## 4. Install Dependencies

```bash
npm install
```

## 5. Start the App (Recommended on Windows)

Use the lock-safe command to avoid `.next/trace` and stale process issues:

```bash
npm run dev:safe
```

Standard command is still available:

```bash
npm run dev
```

Open:

- http://localhost:3000
- Admin setup: http://localhost:3000/admin/setup

## 6. Create Admin Account

Recommended:

1. Open http://localhost:3000/admin/setup
2. Enter email, username, and secure password
3. Submit and sign in at http://localhost:3000/login

Quick test option:

- Use `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env.local`

## 7. Functional Smoke Test

1. Login and confirm protected pages load without redirect loops.
2. Add a lecturer in Lecturers page and verify it appears in list.
3. Add an appraisal in Appraisals page and verify total/category/recommendation.
4. Open Promotions page and verify candidates render correctly.
5. Open Analytics page and verify KPIs, trend table, and filters.
6. Export CSV/PDF from Dashboard/Analytics/Promotions.
7. Open Audit page and verify recent auth, appraisal, and export events.

## 8. Production Check

```bash
npm run build
npm start
```

## 9. Useful Commands

```bash
npm run dev
npm run dev:safe
npm run clean
npm run build
npm run start
npm run lint
```

## 10. Troubleshooting

Database connection error:

```text
Error: connect ECONNREFUSED 127.0.0.1:3306
```

Fix:

- Start MySQL service
- Confirm `.env.local` credentials
- Validate DB exists: `mysql -u root -p -e "SHOW DATABASES;"`

Port already in use:

```text
Error: listen EADDRINUSE
```

Fix (PowerShell):

```powershell
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
Stop-Process -Id <PID> -Force
```

Module resolution error:

```bash
# PowerShell cleanup
if (Test-Path node_modules) { Remove-Item node_modules -Recurse -Force }
if (Test-Path package-lock.json) { Remove-Item package-lock.json -Force }
npm install
```

## 11. Completion Checklist

- [ ] Database initialized and schema loaded (see DATABASE_SETUP.md)
- [x] `.env.local` configured
- [x] `npm install` successful
- [x] `npm run dev:safe` starts correctly
- [x] Login works
- [x] Lecturers/Appraisals/Promotions/Analytics/Audit pages render
- [ ] CSV/PDF exports download successfully
- [x] `npm run build` succeeds

**Next Steps:**

1. Follow [DATABASE_SETUP.md](DATABASE_SETUP.md) to install MySQL locally or use Docker
2. Configure `.env.local` with your database credentials
3. Run schema: `Get-Content .\database\schema.sql | mysql -u root -p`
4. Start app: `npm run dev:safe`
