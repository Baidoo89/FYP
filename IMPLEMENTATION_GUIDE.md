# 📐 Implementation Guide - Full System Architecture

## 🎯 System Overview

The GCTU Promotion System follows a **layered architecture** pattern:

```
┌─────────────────────────────────────────────────────┐
│                   Presentation Layer                │
│         (React Components + Next.js Pages)          │
├─────────────────────────────────────────────────────┤
│                    API Layer                        │
│          (Next.js API Routes + Validation)          │
├─────────────────────────────────────────────────────┤
│              Business Logic Layer                   │
│           (Calculations, Computations)              │
├─────────────────────────────────────────────────────┤
│                  Data Access Layer                  │
│        (Database Connection, Query Helpers)         │
├─────────────────────────────────────────────────────┤
│              Database Layer (MySQL)                 │
│         (Tables, Views, Constraints, Indexes)       │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Module Overview

### Module 1: Authentication (Future Enhancement)
**Status:** 🔲 Not Yet Implemented
**Purpose:** Secure admin access
**Features:**
- Admin login
- Session management
- Role-based access control

---

### Module 2: Lecturer Management ✅ COMPLETE
**Status:** ✅ Phase 1 Complete
**Purpose:** Manage lecturer master data
**Implemented Features:**

#### Database Layer
- Table: `lecturers`
- Fields: id, name, email, department, rank, hire_date, is_active
- Indexes: department, rank, is_active for fast queries

#### API Routes
```
GET    /api/lecturers              → List all lecturers
POST   /api/lecturers              → Create lecturer
GET    /api/lecturers/:id          → Get specific lecturer
PUT    /api/lecturers/:id          → Update lecturer
DELETE /api/lecturers/:id          → Delete lecturer
```

#### UI Components
- `AddLecturerForm.tsx` - Form to add lecturer
- `LecturerList.tsx` - Display table of lecturers
- `app/lecturers/page.tsx` - Lecturer management page

#### Validation
- Required fields: name, email, department, rank
- Email format validation
- Email uniqueness constraint
- Email cannot be changed after creation

---

### Module 3: Appraisal Management 📋 PHASE 2
**Status:** 🔄 Ready for Implementation
**Purpose:** Collect performance scores
**Database Design:**
```sql
CREATE TABLE appraisals (
    id INT PRIMARY KEY,
    lecturer_id INT,
    teaching_score DECIMAL(0-100),
    research_score DECIMAL(0-100),
    service_score DECIMAL(0-100),
    total_score DECIMAL COMPUTED,
    category VARCHAR COMPUTED,
    is_promotion_recommended BOOLEAN COMPUTED,
    appraisal_date DATE,
    reviewed_by VARCHAR,
    comments TEXT
)
```

**Implementation Steps:**
1. Create API routes:
   - `POST /api/appraisals` - Create appraisal
   - `GET /api/appraisals` - List appraisals
   - `GET /api/appraisals/:id` - Get specific
   - `PUT /api/appraisals/:id` - Update
   - `DELETE /api/appraisals/:id` - Delete

2. Create UI components:
   - `AddAppraisalForm.tsx` - Score input form
   - `AppraisalList.tsx` - Display appraisals
   - Integrate calculation library

3. Connect to calculations module

---

### Module 4: Performance Calculation 🧮 PHASE 2
**Status:** 🔄 Logic Ready, UI Integration Pending
**Purpose:** Compute performance metrics
**Already Implemented in `lib/calculations.ts`:**

```typescript
// Function: calculateTotalScore()
// Formula: (Teaching × 0.50) + (Research × 0.30) + (Service × 0.20)
// Example: (85 × 0.5) + (78 × 0.3) + (82 × 0.2) = 82.35

// Function: determineCategory()
// Returns: 'Excellent' | 'Good' | 'Average' | 'Poor'
// Ranges:
//   Excellent: 80-100
//   Good: 70-79
//   Average: 50-69
//   Poor: <50

// Function: isPromotionRecommended()
// Returns: true if total_score >= 80, else false

// Function: computeAppraisalMetrics()
// Returns: { total_score, category, is_promotion_recommended }
```

**Integration:** Call these functions when saving appraisal data

---

### Module 5: Decision Support 🏆 PHASE 3
**Status:** 🔲 Ready for Implementation
**Purpose:** Recommend promotion decisions
**Logic:**
```
IF total_score >= 80 THEN
    recommendation = "RECOMMENDED FOR PROMOTION"
    reason = "Score meets promotion threshold"
ELSE
    recommendation = "NOT RECOMMENDED"
    reason = "Score below 80 threshold"
END IF
```

**Database Table:**
```sql
CREATE TABLE promotion_history (
    id INT PRIMARY KEY,
    lecturer_id INT,
    appraisal_id INT,
    recommended BOOLEAN,
    recommendation_date DATE,
    promotion_approved BOOLEAN,
    approval_date DATE,
    action_notes TEXT
)
```

**Implementation:**
1. Create promotion API routes
2. Create recommendation view component
3. Track decision history
4. Support approval workflow

---

### Module 6: Dashboard & Analytics 📈 PHASE 3
**Status:** 🔄 UI Placeholder Complete, Logic Pending
**Purpose:** System overview and insights
**Dashboard KPIs (Currently Mocked):**
- Total lecturers count
- Average performance score
- Category distribution
- Promotion candidates count

**Analytics to Implement:**
1. Performance trends (db views provided)
2. Department comparisons
3. Category distribution charts
4. Year-over-year analysis
5. Export reports (PDF/Excel)

---

## 🗄️ Complete Database Schema

### Table Relationships

```
lecturers (1) ─────── (N) appraisals
    │                      │
    │                      └──→ performance_trends
    │                      └──→ promotion_history
    │
    └──→ Views:
        - latest_appraisals
        - promotion_candidates
```

### All Tables

**1. lecturers**
- Primary key: id
- Unique: email
- Indexes: department, rank, is_active

**2. appraisals**
- Foreign key: lecturer_id → lecturers.id
- Constraints: teaching_score, research_score, service_score (0-100)
- Computed: total_score, category, is_promotion_recommended
- Indexes: lecturer_id, category, appraisal_date

**3. performance_trends**
- Foreign key: lecturer_id → lecturers.id
- Unique: (lecturer_id, year, quarter)
- Stores: quarterly average scores

**4. promotion_history**
- Foreign keys: lecturer_id, appraisal_id
- Tracks: decisions and approvals

---

## 🔌 API Architecture

### Request/Response Pattern

```typescript
// Request format (input validation)
{
  name: string (required, non-empty)
  email: string (required, valid email, unique)
  department: string (required)
  rank: string (required)
}

// Response format (consistent)
{
  success: boolean
  message?: string
  data?: T
  error?: string
}
```

### Error Handling

| Status | Scenario | Response |
|--------|----------|----------|
| 201 | Create success | `{ success: true, data: {...} }` |
| 200 | Read/Update success | `{ success: true, data: {...} }` |
| 204 | Delete success | `{ success: true }` |
| 400 | Bad request | `{ success: false, error: "Missing fields" }` |
| 404 | Not found | `{ success: false, error: "Not found" }` |
| 409 | Conflict (duplicate) | `{ success: false, error: "Already exists" }` |
| 500 | Server error | `{ success: false, error: "Internal error" }` |

---

## 🧪 Data Flow Example

### Adding a Lecturer (Complete Flow)

```
User Input
    ↓
AddLecturerForm.tsx validates input
    ↓
POST /api/lecturers/route.ts
    ├─ Validate email format
    ├─ Check duplicate email
    ├─ Call lib/db.ts insert()
    ├─ Return 201 + success
    ↓
LecturerList.tsx refreshes
    ↓
RE-fetch /api/lecturers
    ├─ Query database
    ├─ Return all lecturers
    ↓
Update UI with new list
```

### Creating an Appraisal (Future Flow)

```
User selects lecturer → enters scores
    ↓
AddAppraisalForm.tsx validates (0-100)
    ↓
POST /api/appraisals/route.ts
    ├─ Validate scores
    ├─ Call lib/calculations.computeAppraisalMetrics()
    ├─ Get: total_score, category, is_promotion_recommended
    ├─ Call lib/db.ts insert() with computed values
    ├─ Return 201 + appraisal with metrics
    ↓
UI displays results + recommendation
    ↓
Save to database with triggers
    ↓
Update dashboard metrics
```

---

## 🔐 Data Validation Strategy

### Client-Side (React Components)
- Required field checking
- Email format validation
- Range validation (0-100 for scores)
- Real-time form feedback

### Server-Side (API Routes) ⭐ Primary
- Re-validate all inputs
- Check database constraints
- Handle errors with specific messages
- Never trust client data

### Database Layer
- Constraints: NOT NULL, CHECK, UNIQUE, FOREIGN KEY
- Indexes: Performance optimization
- Stored procedures: Future complex logic

---

## 📈 Performance Considerations

### Indexes (Already in Schema)
```sql
INDEX idx_lecturer_id (lecturer_id)
INDEX idx_appraisal_date (appraisal_date)
INDEX idx_category (category)
INDEX idx_lecturer_date (lecturer_id, appraisal_date DESC)
```

### Query Optimization
- Always use WHERE clauses
- Use indexes for filtering
- Limit result sets with pagination (future)
- Denormalize for read-heavy operations

### Database Connection
- Connection pooling (10 connections limit)
- Prepared statements (prevent SQL injection)
- Proper error handling

---

## 🏗️ Complete Module Implementation Checklist

### Phase 1: Lecturer Management ✅
- [x] Database schema
- [x] API CRUD routes
- [x] React components
- [x] Form validation
- [x] Error handling
- [x] UI integration

### Phase 2: Appraisals & Calculations ⏳
- [ ] Appraisal API routes
- [ ] Appraisal UI components
- [ ] Calculate integration
- [ ] Database persistence
- [ ] Results display
- [ ] Validation logic

### Phase 3: Analytics & Promotion ⏳
- [ ] Performance trend queries
- [ ] Analytics dashboard
- [ ] Promotion logic
- [ ] Recommendation display
- [ ] Decision tracking
- [ ] Reports generation

### Phase 4: Advanced Features ⏳
- [ ] Authentication
- [ ] Multi-user support
- [ ] Export functionality
- [ ] Email notifications
- [ ] Audit logging
- [ ] Performance optimization

---

## 📚 File Reference

| Purpose | File | Status |
|---------|------|--------|
| Configuration | `next.config.js`, `tsconfig.json` | ✅ Done |
| Types | `types/index.ts` | ✅ Done |
| Database | `database/schema.sql` | ✅ Done |
| Calculations | `lib/calculations.ts` | ✅ Done |
| DB Layer | `lib/db.ts` | ✅ Done |
| API - Lecturers | `app/api/lecturers/route.ts` | ✅ Done |
| API - Lecturer Detail | `app/api/lecturers/[id]/route.ts` | ✅ Done |
| Component - Form | `components/AddLecturerForm.tsx` | ✅ Done |
| Component - List | `components/LecturerList.tsx` | ✅ Done |
| Page - Home | `app/page.tsx` | ✅ Done |
| Page - Dashboard | `app/dashboard/page.tsx` | ✅ Done |
| Page - Lecturers | `app/lecturers/page.tsx` | ✅ Done |
| Layout | `app/layout.tsx` | ✅ Done |

---

## 🚀 Next Immediate Steps

1. **Test Current Implementation**
   - Set up database
   - Start dev server
   - Add lecturers via UI
   - Test API endpoints

2. **Implement Appraisal Module**
   - Create API routes for appraisals
   - Build form component
   - Integrate calculation logic
   - Display results

3. **Add Analytics**
   - Query performance_trends table
   - Build chart components
   - Add dashboard metrics

4. **Decision Support**
   - Implement promotion logic
   - Track decisions
   - Add approval workflow

---

**Architecture is designed for scalability and future enhancement.**
**Each phase builds upon previous work.**
**All code follows clean architecture principles.**
