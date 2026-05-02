# GCTU Promotion System

**A comprehensive web-based platform for lecturer appraisal management, promotion readiness tracking, and transparent promotion decisions.**

---

## 🎯 Overview

**GCTU Promotion System** is a full-stack Next.js application designed for managing lecturer appraisal evidence, promotion readiness analytics, and institutional decision support.

### Key Features ✨
- ✅ Lecturer management (Add, Edit, View, Delete)
- ✅ Performance appraisal tracking
- ✅ Weighted performance calculations (Teaching 50%, Research 30%, Service 20%)
- ✅ Automatic performance categorization (Excellent, Good, Average, Poor)
- ✅ Promotion recommendation logic
- ✅ Interactive admin dashboard
- ✅ Performance analytics and reporting
- ✅ Clean, modern UI with Tailwind CSS

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 18, TypeScript |
| **Backend** | Next.js API Routes |
| **Database** | MySQL 8.0+ |
| **Styling** | Tailwind CSS / Plain CSS |
| **ORM** | Raw SQL (mysql2/promise) |

---

## 📁 Project Structure

```
lecturer-performance-system/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with navigation
│   ├── page.tsx                 # Home page
│   ├── api/                     # API Routes
│   │   ├── lecturers/
│   │   │   ├── route.ts         # GET/POST lecturers
│   │   │   └── [id]/route.ts    # GET/PUT/DELETE lecturer
│   │   └── appraisals/          # Appraisal APIs (Phase 2)
│   ├── dashboard/               # Dashboard page
│   ├── lecturers/               # Lecturers management page
│   ├── appraisals/              # Appraisals page (Phase 2)
│   ├── analytics/               # Analytics page (Phase 2)
│   └── promotions/              # Promotions page (Phase 2)
├── components/                   # Reusable React components
│   ├── AddLecturerForm.tsx      # Form to add lecturer
│   └── LecturerList.tsx         # Display lecturers table
├── lib/                         # Utility libraries
│   ├── db.ts                    # Database connection & helpers
│   └── calculations.ts          # Performance calculation logic
├── types/                       # TypeScript interfaces
│   └── index.ts                 # All type definitions
├── database/                    # Database scripts
│   └── schema.sql              # Complete database schema
├── package.json
├── tsconfig.json
├── next.config.js
└── .env.local.example           # Environment variables template
```

---

## 🗄️ Database Schema

### Tables:
1. **lecturers** - Store lecturer information
2. **appraisals** - Performance scores and computed metrics
3. **performance_trends** - Historical analytics data
4. **promotion_history** - Track promotion decisions

See [database/schema.sql](database/schema.sql) for complete schema.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- MySQL 8.0+ running locally or remote
- Git

### Installation

#### 1. Clone or Navigate to Project
```bash
cd lecturer-performance-system
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Setup Database

**See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed instructions.**

Quick commands (if MySQL is installed):

```bash
# Load schema
mysql -u root -p < database/schema.sql

# Verify
mysql -u root -p -e "USE lecturer_performance_db; SHOW TABLES;"
```

**Docker option:** For reproducible FYP setup, see DATABASE_SETUP.md for Docker Compose configuration.

#### 4. Configure Environment
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lecturer_performance_db
NEXT_PUBLIC_API_URL=http://localhost:3000
```

#### 5. Start Development Server
```bash
npm run dev:safe
```

`dev:safe` is recommended on Windows because it clears stale Node processes and `.next` lock artifacts before booting Next.js.

Visit **http://localhost:3000**

---

## 📖 Usage Guide

### Phase 1: Lecturer Management (Current Implementation)

#### Add a Lecturer
1. Navigate to **Lecturers** in sidebar
2. Fill the form with:
   - Full Name
   - Email (unique)
   - Department
   - Rank/Position
3. Click "Add Lecturer"

#### View All Lecturers
- The lecturer list appears on the right side
- All active lecturers are displayed in a table

#### Edit/Delete (Demo Ready)
- API routes support PUT and DELETE
- UI components for edit/delete coming in Phase 2

---

### Current Modules
- **Appraisals Module** - Create performance appraisals
- **Performance Calculations** - Automatic score computation
- **Analytics Dashboard** - Trends and insights
- **Promotion Decisions** - AI-driven recommendations
- **Reporting** - Export and analytics reports

---

## 🔧 API Endpoints

### Lecturers Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lecturers` | Get all lecturers |
| POST | `/api/lecturers` | Create new lecturer |
| GET | `/api/lecturers/:id` | Get specific lecturer |
| PUT | `/api/lecturers/:id` | Update lecturer |
| DELETE | `/api/lecturers/:id` | Delete lecturer |

### Example Request:
```bash
# Get all lecturers
curl http://localhost:3000/api/lecturers

# Create lecturer
curl -X POST http://localhost:3000/api/lecturers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Jane Doe",
    "email": "jane.doe@uni.edu",
    "department": "Computer Science",
    "rank": "Associate Professor"
  }'
```

---

## 💡 Performance Calculation Formula

```
Total Score = (Teaching × 0.50) + (Research × 0.30) + (Service × 0.20)

Categories:
- Excellent:   80-100
- Good:        70-79
- Average:     50-69
- Poor:        < 50

Promotion Rule:
- RECOMMENDED if Total Score ≥ 80
- NOT RECOMMENDED if Total Score < 80
```

---

## 🔑 Key Functions

### Performance Calculations (`lib/calculations.ts`)
```typescript
calculateTotalScore()          // Compute weighted average
determineCategory()            // Get performance category
isPromotionRecommended()       // Check promotion eligibility
computeAppraisalMetrics()      // Complete appraisal computation
generatePerformanceSummary()   // Statistics generation
```

### Database Operations (`lib/db.ts`)
```typescript
query()                        // Execute raw SQL
getRow()                       // Fetch single record
getRows()                      // Fetch multiple records
insert()                       // Insert data
update()                       // Update data
deleteRecord()                 // Delete data
```

---

## 🧪 Testing the API

### Using Thunder Client / Postman

1. **Create Lecturer**
   - POST: `http://localhost:3000/api/lecturers`
   - Body:
   ```json
   {
     "name": "Dr. Test User",
     "email": "test@university.edu",
     "department": "Computer Science",
     "rank": "Lecturer"
   }
   ```

2. **Get All Lecturers**
   - GET: `http://localhost:3000/api/lecturers`

3. **Get Specific Lecturer**
   - GET: `http://localhost:3000/api/lecturers/1`

---

## 📊 Architecture Highlights

### Clean Separation
- **Routes & Controllers** in `app/api/`
- **Business Logic** in `lib/`
- **UI Components** in `components/`
- **Type Safety** with TypeScript

### Performance
- Indexed database queries
- Efficient pagination-ready design
- Optimized component rendering
- Connection pooling for DB

### Scalability
- Modular component design
- Reusable utility functions
- Database views for analytics
- Ready for future microservices

---

## 🎓 Academic Considerations

✅ **Meets Requirements:**
- Data collection ✓
- Computation logic ✓
- Analysis capability ✓
- Decision support ✓
- Professional architecture ✓

✅ **Production-Ready:**
- Error handling ✓
- Input validation ✓
- Database constraints ✓
- Clean code standards ✓

---

## 🐛 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution:** Ensure MySQL is running and credentials in `.env.local` are correct

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:** 
```bash
# Kill process on port 3000
npx kill-port 3000
npm run dev
```

### Missing Lecturers in List
- Ensure database is properly initialized
- Check `.env.local` database name
- Verify MySQL user has proper permissions

---

## 📝 Next Steps (Phase 2)

1. **Appraisal Module**
   - API routes for appraisal CRUD
   - Form for score input
   - Automatic calculation integration

2. **Analytics Module**
   - Dashboard with charts
   - Trend analysis views
   - Export functionality

3. **Promotion Module**
   - Recommendation engine
   - Decision workflow
   - Approval tracking

4. **Testing**
   - Unit tests for calculations
   - Integration tests for APIs
   - E2E tests for workflows

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 👤 Author

**Developed as Final Year Project (FYP)**
- GCTU Promotion System
- Submission Date: 2026

---

## 📄 License

This project is for educational purposes. All rights reserved.

---

**Status:** ✅ Phase 1 Complete | 🔄 Phase 2-4 In Development

**Last Updated:** April 2026
