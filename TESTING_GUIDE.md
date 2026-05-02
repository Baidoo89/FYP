# 🧪 Testing & Validation Guide

## ✅ Pre-Setup Checklist

Before testing, ensure:
- [ ] MySQL is installed and running
- [x] Node.js 18+ installed
- [x] Project dependencies installed: `npm install`
- [ ] Database created: `mysql < database/schema.sql`
- [x] `.env.local` configured with DB credentials
- [x] Dev server started: `npm run dev:safe`

**Deployment note:** The project builds and the UI routes respond, but MySQL still needs to be available on the target deployment host or managed database service before production launch.

---

## 🔍 Test Phase 1: Database Verification

### 1.1 Connect to Database
```bash
mysql -u root -p

# Then:
USE lecturer_performance_db;
SHOW TABLES;
```

**Expected Output:**
```
+--------------------------------+
| Tables_in_lecturer_performance |
+--------------------------------+
| appraisals                     |
| lecturers                      |
| performance_trends             |
| promotion_history              |
+--------------------------------+
```

### 1.2 Verify Sample Data
```sql
SELECT COUNT(*) as lecturer_count FROM lecturers;
SELECT COUNT(*) as appraisal_count FROM appraisals;
```

**Expected Output:**
```
lecturer_count: 5
appraisal_count: 5
```

### 1.3 Check Indexes
```sql
SHOW INDEXES FROM lecturers;
SHOW INDEXES FROM appraisals;
```

**Expected:** Multiple indexes for performance optimization

---

## 🌐 Test Phase 2: Application Access

### 2.1 Start Development Server
```bash
npm run dev
```

**Expected Output:**
```
▲ Next.js 15.1.0
- Local: http://localhost:3000
```

### 2.2 Navigate Browser
Open: `http://localhost:3000`

**Expected:**
- ✅ Home page loads
- ✅ Navigation sidebar visible
- ✅ Menu links functional
- ✅ Professional UI rendering

### 2.3 Test Navigation
- Click "Lecturers" → Should load lecturer management page
- Click "Dashboard" → Should show KPI cards
- Click "Appraisals" → Should show "Coming Soon" message
- Click "Analytics" → Should show "Coming Soon" message
- Click "Promotions" → Should show "Coming Soon" message

---

## 📝 Test Phase 3: API Endpoints

### 3.1 Test GET All Lecturers

**cURL:**
```bash
curl http://localhost:3000/api/lecturers
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Dr. John Smith",
      "email": "john.smith@university.edu",
      "department": "Computer Science",
      "rank": "Associate Professor",
      "is_active": true,
      "created_at": "2026-04-16T10:00:00Z"
    },
    // ... more lecturers
  ]
}
```

**Postman:**
- Method: GET
- URL: http://localhost:3000/api/lecturers
- Headers: None needed
- Body: None

### 3.2 Test GET Specific Lecturer

**cURL:**
```bash
curl http://localhost:3000/api/lecturers/1
```

**Expected:** Single lecturer object with status 200

### 3.3 Test POST Create Lecturer

**cURL:**
```bash
curl -X POST http://localhost:3000/api/lecturers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Test User",
    "email": "test.user@university.edu",
    "department": "Data Science",
    "rank": "Lecturer"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Lecturer created successfully",
  "data": {
    "id": 6,
    "name": "Dr. Test User",
    "email": "test.user@university.edu",
    "department": "Data Science",
    "rank": "Lecturer"
  }
}
```

**Postman:**
- Method: POST
- URL: http://localhost:3000/api/lecturers
- Headers: Content-Type: application/json
- Body (raw JSON):
```json
{
  "name": "Dr. Test User",
  "email": "test.user@university.edu",
  "department": "Data Science",
  "rank": "Lecturer"
}
```

### 3.4 Test POST with Invalid Email

**Should Fail:**
```bash
curl -X POST http://localhost:3000/api/lecturers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Bad Email",
    "email": "not-an-email",
    "department": "CS",
    "rank": "Lecturer"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "error": "Invalid email format"
}
```

### 3.5 Test POST Duplicate Email

**Should Fail:**
```bash
curl -X POST http://localhost:3000/api/lecturers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Duplicate",
    "email": "john.smith@university.edu",
    "department": "CS",
    "rank": "Lecturer"
  }'
```

**Expected Response (409):**
```json
{
  "success": false,
  "error": "Email already exists"
}
```

### 3.6 Test PUT Update Lecturer

**cURL:**
```bash
curl -X PUT http://localhost:3000/api/lecturers/1 \
  -H "Content-Type: application/json" \
  -d '{
    "department": "Cyber Security",
    "rank": "Senior Lecturer"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Lecturer updated successfully"
}
```

### 3.7 Test DELETE Lecturer

**cURL:**
```bash
curl -X DELETE http://localhost:3000/api/lecturers/6
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Lecturer deleted successfully"
}
```

**Verify DELETE:**
```bash
curl http://localhost:3000/api/lecturers/6
```

**Should Return (404):**
```json
{
  "success": false,
  "error": "Lecturer not found"
}
```

---

## 🖥️ Test Phase 4: UI Components

### 4.1 Add Lecturer via UI

**Steps:**
1. Navigate to http://localhost:3000/lecturers
2. In left panel "Add New Lecturer":
   - Full Name: `Dr. UI Test`
   - Email: `ui.test@university.edu`
   - Department: `Software Engineering`
   - Rank: `Associate Professor`
3. Click "Add Lecturer"

**Expected:**
- ✅ Green success message appears
- ✅ Form clears
- ✅ New lecturer appears in right table
- ✅ Count updates

### 4.2 View Lecturers List

**Verify:**
- ✅ Table displays all lecturers
- ✅ All columns populated: ID, Name, Email, Department, Rank, Status
- ✅ Status badge shows "Active" or "Inactive"
- ✅ Rows have alternating background colors
- ✅ Hover effect on table rows

### 4.3 Validation Tests

**Test 1: Missing Name**
- Leave Full Name empty
- Try to submit
- Expected: Form prevents submission (HTML5 required)

**Test 2: Invalid Email**
- Enter: `invalid-email`
- Try to submit
- Expected: Browser validation + server validation

**Test 3: Duplicate Email**
- Use existing email: `john.smith@university.edu`
- Try to submit
- Expected: Error message: "Email already exists"

### 4.4 Dashboard View

**Navigate to:** http://localhost:3000/dashboard

**Verify:**
- ✅ KPI cards display: Total Lecturers, Average Score, Excellent, Promotion Candidates
- ✅ Performance distribution bars show
- ✅ Quick action links visible

---

## 📊 Test Phase 5: Data Integrity

### 5.1 Database Constraints

**Test: Try to insert invalid score (via direct SQL - should fail)**
```sql
-- This should FAIL due to CHECK constraint
INSERT INTO appraisals (lecturer_id, teaching_score, research_score, service_score, total_score, category, appraisal_date)
VALUES (1, 150, 50, 50, 80, 'Good', '2026-04-16');
```

**Expected:** Error: Check constraint violation

### 5.2 Foreign Key Integrity

**Test: Try to delete lecturer with appraisals**
```bash
# If lecturer 1 has appraisals, deletion should CASCADE
curl -X DELETE http://localhost:3000/api/lecturers/1
```

**Expected:** Lecturer and related appraisals deleted (due to CASCADE)

### 5.3 Unique Constraint

**Test: Email uniqueness**
```sql
-- This should FAIL
INSERT INTO lecturers (name, email, department, rank)
VALUES ('Duplicate Check', 'john.smith@university.edu', 'CS', 'Lecturer');
```

**Expected:** Error: Duplicate entry

---

## 📈 Test Phase 6: Performance Calculations (Future)

When appraisal module is implemented:

### Test Calculation Logic
```typescript
// From lib/calculations.ts
calculateTotalScore(85, 78, 82)
// Should return: 82.35

determineCategory(82.35)
// Should return: 'Excellent'

isPromotionRecommended(82.35)
// Should return: true
```

### Test Cases
| Teaching | Research | Service | Expected Total | Expected Category | Promotion? |
|----------|----------|---------|-----------------|------------------|------------|
| 90 | 85 | 90 | 88.50 | Excellent | Yes |
| 75 | 70 | 75 | 73.50 | Good | No |
| 60 | 55 | 55 | 57.50 | Average | No |
| 40 | 35 | 35 | 37.50 | Poor | No |
| 80 | 80 | 80 | 80.00 | Excellent | Yes |

---

## 🚨 Error Handling Tests

### Test 1: Database Down
1. Stop MySQL server
2. Try to add lecturer
3. Expected: "Failed to add lecturer" error message

### Test 2: Invalid JSON
```bash
curl -X POST http://localhost:3000/api/lecturers \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```
**Expected:** 400 error

### Test 3: Missing Required Field
```bash
curl -X POST http://localhost:3000/api/lecturers \
  -H "Content-Type: application/json" \
  -d '{"name": "Dr. Test"}'
```
**Expected:** 400 error with "Missing required fields"

---

## ✅ Validation Checklist

### Database ✓
- [ ] MySQL running
- [ ] Database created
- [ ] Sample data exists
- [ ] All tables present
- [ ] Indexes created

### Application ✓
- [ ] Dev server starts
- [ ] Home page loads
- [ ] Navigation works
- [ ] Dashboard displays
- [ ] No console errors

### Lecturer Management ✓
- [ ] Can view lecturers
- [ ] Can add lecturer
- [ ] Can update lecturer (API)
- [ ] Can delete lecturer (API)
- [ ] Form validation works
- [ ] Error messages display
- [ ] Success messages display

### API ✓
- [ ] GET all endpoints working
- [ ] POST create working
- [ ] GET single working
- [ ] PUT update working
- [ ] DELETE working
- [ ] Status codes correct
- [ ] Error responses proper

### UI ✓
- [ ] Components render
- [ ] Form functional
- [ ] Table displays
- [ ] Real-time updates
- [ ] Responsive layout
- [ ] Professional appearance

---

## 📋 Test Results Template

Use this to document your testing:

```markdown
# Test Run - [Date]

## Database
- Database Connection: ✓
- Tables Created: ✓
- Sample Data: ✓

## Application
- Dev Server: ✓
- Home Page: ✓
- Navigation: ✓

## Lecturer Management
- View Lecturers: ✓
- Add Lecturer: ✓
- Update Lecturer: ✓
- Delete Lecturer: ✓

## API Testing
- GET All: ✓
- GET Single: ✓
- POST Create: ✓
- PUT Update: ✓
- DELETE: ✓

## Error Handling
- Invalid Email: ✓
- Duplicate Email: ✓
- Missing Fields: ✓
- Database Error: ✓

## Overall Status: ✅ PASS
```

---

## 🎯 Recommended Testing Order

1. Database verification (5 min)
2. Application access (5 min)
3. API endpoints (10 min)
4. UI components (10 min)
5. Data integrity (5 min)
6. Error handling (10 min)

**Total: ~45 minutes**

---

**All tests should pass. If not, check error messages and TROUBLESHOOTING section in README.md**
