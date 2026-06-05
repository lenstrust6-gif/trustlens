# TrustLens Manual Testing Guide

## Quick Start (5 minutes)

### Prerequisites
- Docker Desktop running
- Node.js 25+, Python 3.11+
- Terminal with 2+ windows

### Step 1: Start Services
```bash
cd /Users/tusway/TrustLens
docker-compose up -d

# Verify services are running
docker-compose ps
# Both postgres and redis should show "healthy"
```

### Step 2: Initialize Backend
```bash
cd backend

# Create virtual env if needed
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -e .

# Run database migrations
alembic upgrade head

# Seed 50 sample products
python -m backend.scripts.seed_products.py
```

You should see:
```
✓ boAt Airdopes 141 (tws-earbuds)
✓ Noise ColorFitPro4 (smartwatches)
... (50 total)
✅ Seeded 50/50 products
```

### Step 3: Start Backend Dev Server (Terminal 1)
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
Uvicorn running on http://0.0.0.0:8000
```

### Step 4: Start Frontend Dev Server (Terminal 2)
```bash
cd frontend
npm run dev
```

You should see:
```
  ▲ Next.js 16.2.7
  - Local: http://localhost:3000
```

### Step 5: Test in Browser
Open these URLs:
- **Frontend**: http://localhost:3000/in
- **API Health**: http://localhost:8000/api/v1/health
- **Admin Dashboard**: http://localhost:3000/admin

---

## Test Flows

### Flow 1: Homepage & Quick Picks
**Objective**: Verify frontend homepage loads and quick picks are clickable

1. Open http://localhost:3000/in
2. Verify you see:
   - TrustLens logo
   - Search bar with placeholder "Search any product..."
   - India flag (🇮🇳) with tagline
   - "Quick Picks" section with 3 products (boAt, Noise, Mi)
3. Click "boAt Airdopes 141" → should redirect to search results
4. Verify no console errors in browser DevTools (F12)

**Expected Result**: ✅ All elements render, search works, no errors

---

### Flow 2: Search & Product Page
**Objective**: Test search → verdict card rendering

1. From homepage, type "boAt Airdopes 141" in search bar
2. Press Enter or click Search
3. Wait for loading state to disappear
4. Verify you see a VerdictCard with:
   - **TrustScore**: Large number (e.g., 8.3) with /10 label
   - **Confidence Tier**: Badge (e.g., "Established Verdict")
   - **Summary**: 80–120 word paragraph explaining the product
   - **Best For / Avoid If**: Two sections with user profiles
   - **Pros / Cons**: Top 3 each with mention counts
   - **Feature Scores**: Horizontal bar charts (sound, battery, comfort, etc.)
   - **Data Summary**: YouTube count, Amazon count, Auth Score, Excluded
5. Scroll to bottom and verify no "fake review" language appears

**Expected Result**: ✅ All 9 sections render correctly

**Quick Test Command**:
```bash
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"product_name": "boAt Airdopes 141", "locale": "in"}'
```

Should return a JSON VerdictCard object.

---

### Flow 3: Admin Dashboard
**Objective**: Verify admin endpoints and dashboard UI

1. Open http://localhost:3000/admin
2. Click "Overview" tab
3. Verify KPI cards appear:
   - "Total Products": Should be 50
   - "Verdicts Ready": Should be 50
   - "Pending Searches": Should be 0 or low
   - "Cache Hit Rate": Should show ~87%
   - "Emails Captured": Should be 0
4. Click "Products" tab
5. Verify product table loads with columns:
   - Product name
   - Category
   - Trust Score (with bar chart)
   - Confidence Tier (badge)
6. Scroll and verify products appear (boAt, Noise, Realme, etc.)

**Expected Result**: ✅ Dashboard loads, all KPIs show correct numbers

**Quick Test Command**:
```bash
curl http://localhost:8000/admin/stats
```

Should return:
```json
{
  "status": "ok",
  "total_products": 50,
  "total_verdicts": 50,
  "pending_misses": 0,
  "cache_hit_rate": 0.87,
  "emails_captured": 0
}
```

---

### Flow 4: Error Handling
**Objective**: Verify 404 and error pages work

**Test 4a: Product Not Found**
1. Go to http://localhost:3000/in/tws-earbuds/xyz-nonexistent
2. Verify you see "404 – Not Found" page
3. Check for CTAs:
   - "Suggest This Product" button → links to /in/submit
   - "Back to Home" button → links to /in
4. No error in console

**Test 4b: Search for Non-existent Product**
1. From homepage, search for "abcxyz-product-that-does-not-exist"
2. Should show error: "No reviews found for this product"
3. CTA: "Try submitting it for analysis" → links to /in/submit

**Test 4c: Methodology Page**
1. Go to http://localhost:3000/in/methodology
2. Verify page loads with sections:
   - "How TrustLens Works"
   - "Data Sources"
   - "Trust Score"
   - "Authenticity Scoring" (explains 6 signals)
   - "Transparency"
   - "Disclaimer"
3. Search page for "fake review" → should NOT find any matches
4. Verify "Authenticity Score" appears instead

**Test 4d: Fakespot Alternative Page**
1. Go to http://localhost:3000/in/fakespot-alternative
2. Verify page loads with:
   - H1: "Fakespot Alternative for India"
   - "Why TrustLens?" section
   - "How It Works" (4 steps)
   - Search bar at bottom
3. Search page for "fake review" → should NOT find any
4. "Authenticity Score" should appear multiple times

**Expected Result**: ✅ All error pages render, no "fake review" language

---

### Flow 5: Metadata & SEO
**Objective**: Verify SEO tags and structured data

1. Go to http://localhost:3000/in/tws-earbuds/boat-airdopes-141
2. Open browser DevTools (F12) → Elements tab
3. Look in `<head>` for:
   - `<title>`: Should contain "boAt Airdopes 141" + "TrustLens"
   - `<meta name="description">`: Should have product summary
   - `<script type="application/ld+json">`: Should contain Review schema

Example structured data:
```json
{
  "@context": "https://schema.org",
  "@type": "Review",
  "itemReviewed": {
    "@type": "Product",
    "name": "boAt Airdopes 141"
  },
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": 8.3,
    "bestRating": 10
  },
  "reviewBody": "..."
}
```

4. Test sitemap: Open http://localhost:3000/sitemap.xml
   - Should return XML with 60+ URLs
   - Verify entries for /in, /us, /uk
   - Verify entries for categories
   - Verify entries for seed products

5. Test robots.txt: Open http://localhost:3000/robots.txt
   - Should disallow /admin and /api
   - Should reference /sitemap.xml

**Expected Result**: ✅ All metadata present and correct

---

### Flow 6: API Health & Endpoints
**Objective**: Verify backend API endpoints respond correctly

**Test 6a: Health Check**
```bash
curl http://localhost:8000/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "db": "connected",
  "redis": "connected",
  "cache_hit_rate": 0.85,
  "amazon_provider": "rainforest"
}
```

**Test 6b: Search Endpoint**
```bash
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"product_name": "Noise ColorFitPro4", "locale": "in"}'
```

Expected: VerdictCard JSON with all 9 sections

**Test 6c: Get Verdict Endpoint**
```bash
curl http://localhost:8000/api/v1/verdict/in/noise-colorfitpro4
```

Expected: Same VerdictCard format

**Test 6d: Submit Product Endpoint**
```bash
curl -X POST http://localhost:8000/api/v1/submit \
  -H "Content-Type: application/json" \
  -d '{"product_name": "Test Product", "email": "test@example.com", "locale": "in"}'
```

Expected:
```json
{
  "status": "ok",
  "message": "Product 'Test Product' submitted. We'll analyze it and email test@example.com when ready!"
}
```

**Test 6e: Admin Endpoints**
```bash
# Stats
curl http://localhost:8000/admin/stats

# Products
curl http://localhost:8000/admin/products

# Misses
curl http://localhost:8000/admin/misses

# Emails (should show your test submission)
curl http://localhost:8000/admin/emails
```

**Expected Result**: ✅ All endpoints return 200 OK with correct data

---

### Flow 7: Code Quality Checks
**Objective**: Verify no regressions in tests or "fake review" language

**Test 7a: Run Full Test Suite**
```bash
cd /Users/tusway/TrustLens/backend
python -m pytest tests/ -v
```

Expected output:
```
===== 49 passed, 20 warnings in 10.48s =====
```

All 49 tests should pass.

**Test 7b: Check for "fake review" Language**
```bash
grep -ri "fake review" /Users/tusway/TrustLens/frontend/src --include="*.tsx"
```

Expected: No matches (empty output)

**Test 7c: Frontend Build**
```bash
cd /Users/tusway/TrustLens/frontend
npm run build
```

Expected output should end with:
```
✓ Compiled successfully
```

No TypeScript errors.

**Expected Result**: ✅ All tests pass, no "fake review" language, clean build

---

## Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is in use
lsof -i :8000

# Check database connection
python -c "from sqlalchemy import create_engine; print(create_engine('postgresql://...').connect())"
```

### Frontend won't start
```bash
# Check port 3000
lsof -i :3000

# Clear cache
rm -rf .next node_modules/.cache
npm run dev
```

### Database is empty (no seed data)
```bash
cd backend
python -m backend.scripts.seed_products.py

# Verify
python -c "from backend.db.models import ProductModel; import asyncio; from backend.db import repositories as repos"
```

### Redis not connected
```bash
# Check if Redis is running
docker-compose ps redis

# Try to connect
redis-cli ping
# Should return "PONG"
```

---

## Checklist

Use this checklist to verify all functionality:

### Frontend
- [ ] Homepage loads with search bar
- [ ] Quick picks are clickable and searchable
- [ ] Search returns VerdictCard
- [ ] All 9 VerdictCard sections render
- [ ] Trust Score displays 0–10 scale
- [ ] No "fake review" language in UI
- [ ] Admin dashboard loads and shows KPIs
- [ ] 404 page appears for missing products
- [ ] Error page renders on errors
- [ ] Mobile responsive (test at 375px width)
- [ ] Navigation links work (/methodology, /submit, /fakespot-alternative)

### Backend
- [ ] /api/v1/health returns 200 OK
- [ ] /api/v1/search returns VerdictCard
- [ ] /api/v1/verdict/{locale}/{slug} returns verdict
- [ ] /api/v1/submit accepts email
- [ ] /admin/stats returns KPIs
- [ ] /admin/products returns product list
- [ ] /admin/misses returns search misses
- [ ] /admin/emails returns captured emails
- [ ] Database has 50 seed products
- [ ] Cache is functioning (Redis connected)

### Code Quality
- [ ] All 49 tests pass
- [ ] No TypeScript errors
- [ ] No "fake review" in codebase
- [ ] Frontend builds cleanly
- [ ] Backend starts without errors

### Legal Compliance
- [ ] No "fake review" language anywhere
- [ ] "Authenticity Score" used consistently
- [ ] Methodology page accessible
- [ ] All verdicts explain scoring method

---

## Expected Performance

- **Homepage load**: <1 second
- **Search (cache miss)**: 1–2 seconds
- **Search (cache hit)**: <100ms
- **Product page load**: <1 second
- **Admin dashboard load**: <500ms
- **API response time**: <100ms

---

## Next Steps After Testing

1. **Fix any bugs** you find (note them below)
2. **Run full test suite**: `python -m pytest backend/tests/ -v`
3. **Check frontend build**: `npm run build`
4. **Deploy to Vercel + Railway** when ready
5. **Run seed_products.py** on production database

Good luck! 🚀
