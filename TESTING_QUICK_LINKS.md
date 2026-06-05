# TrustLens Testing — Quick Links & Commands

## 🌐 Frontend URLs (Running Now)

**Main Application:**
- http://localhost:3000/in — Homepage (search bar + quick picks)
- http://localhost:3000/admin — Admin dashboard

**Pages to Test:**
- http://localhost:3000/in/methodology — Legal methodology page
- http://localhost:3000/in/fakespot-alternative — Fakespot alternative landing
- http://localhost:3000/in/submit — Product submission + notify-me form
- http://localhost:3000/in/tws-earbuds/nonexistent — 404 error page
- http://localhost:3000/sitemap.xml — SEO sitemap
- http://localhost:3000/robots.txt — SEO robots rules

## 🔧 Backend Commands (Ready to Start)

**Start Backend API Server** (in new terminal):
```bash
cd /Users/tusway/TrustLens
source backend/venv/bin/activate
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Test Backend Health** (once running):
```bash
curl http://localhost:8000/api/v1/health
```

## 🧪 Testing Commands

**Run All Tests** (49 should pass):
```bash
cd /Users/tusway/TrustLens
source backend/venv/bin/activate
python -m pytest backend/tests/ -v
```

**Build Frontend** (should succeed with no errors):
```bash
cd /Users/tusway/TrustLens/frontend
npm run build
```

**Check for "Fake Review" Language** (should be empty):
```bash
grep -r "fake review" /Users/tusway/TrustLens/frontend/src
```

## 💾 Database Commands

**Connect to Database** (via psql):
```bash
psql -h localhost -U trustlens -d trustlens
```

**Common Queries** (once in psql):
```sql
-- List all tables
\dt

-- Count products
SELECT COUNT(*) FROM products;

-- Count verdicts
SELECT COUNT(*) FROM verdicts;

-- Show sample products
SELECT name, slug, category FROM products LIMIT 5;

-- Show sample verdicts with scores
SELECT p.name, v.trust_score, v.confidence_tier 
FROM products p 
LEFT JOIN verdicts v ON p.id = v.product_id 
LIMIT 10;
```

## 🚀 API Endpoints (Test with curl)

**Health Check:**
```bash
curl http://localhost:8000/api/v1/health
```

**Search for Product:**
```bash
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"product_name": "boAt Airdopes 141", "locale": "in"}'
```

**Get Verdict:**
```bash
curl http://localhost:8000/api/v1/verdict/in/boat-airdopes-141
```

**Admin Stats:**
```bash
curl http://localhost:8000/admin/stats
```

**Admin Products:**
```bash
curl http://localhost:8000/admin/products
```

**Submit Product:**
```bash
curl -X POST http://localhost:8000/api/v1/submit \
  -H "Content-Type: application/json" \
  -d '{"product_name": "Test Product", "email": "test@example.com", "locale": "in"}'
```

## 📋 Infrastructure Status

**Docker Services:**
```bash
docker-compose ps
```

Should show:
- trustlens-postgres-1 (Up, healthy)
- trustlens-redis-1 (Up, healthy)

**Check Database Connection:**
```bash
docker exec trustlens-postgres-1 psql -U trustlens -d trustlens -c "SELECT 1"
```

**Check Redis Connection:**
```bash
docker exec trustlens-redis-1 redis-cli ping
```

## 📊 Seed Products (Available for Testing)

**TWS Earbuds:**
- boAt Airdopes 141
- Noise Buds Pro
- Realme Buds Air 3S
- OnePlus Buds Z2

**Smartwatches:**
- Noise ColorFitPro4
- boAt Storm
- Fire-Boltt Venus
- Realme Watch 4

**Wireless Headphones:**
- boAt Rockerz 400
- JBL Tune 710BT
- Sennheiser HD 450SE
- Sony WH-CH520

**Bluetooth Speakers:**
- JBL Go 3
- boAt Stone 800
- UE Boom 3
- Sony SRS-XB23

**Power Banks:**
- Mi Power Bank 3i
- boAt Energyshroom PB500
- Realme 30000mAh
- Anker PowerCore Essential 20000

(50 total across 5 categories)

## 📝 Testing Checklist

- [ ] Frontend homepage loads (http://localhost:3000/in)
- [ ] Admin dashboard accessible (http://localhost:3000/admin)
- [ ] All pages render (/methodology, /fakespot-alternative, /submit, /404)
- [ ] 49/49 tests pass (python -m pytest backend/tests/ -v)
- [ ] Frontend builds cleanly (npm run build)
- [ ] No "fake review" language found
- [ ] Backend starts without errors (uvicorn)
- [ ] Health check returns 200 OK
- [ ] Search endpoint responds
- [ ] Admin stats show correct counts
- [ ] Database connection works
- [ ] Redis connection works

## 🆘 Troubleshooting

**Port 3000 in use?**
```bash
lsof -i :3000
kill -9 <PID>
```

**Port 8000 in use?**
```bash
lsof -i :8000
kill -9 <PID>
```

**Frontend won't start?**
```bash
rm -rf frontend/.next node_modules/.cache
npm run dev
```

**Backend won't connect to database?**
```bash
docker-compose ps  # Check if services are healthy
docker logs trustlens-postgres-1  # Check postgres logs
```

---

**Everything is ready for testing. Start with: http://localhost:3000/in**
