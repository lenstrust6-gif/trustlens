# TrustLens 🔍

**AI-powered product review intelligence for India.** Authentic verdicts from YouTube + Amazon using AI synthesis + authenticity scoring.

![Build](https://img.shields.io/badge/build-passing-green) ![Tests](https://img.shields.io/badge/tests-49%20passing-green) ![License](https://img.shields.io/badge/license-MIT-blue)

## What is TrustLens?

TrustLens analyzes product reviews from multiple sources (YouTube video comments + Amazon.in verified purchases) and synthesizes them into **Trust Score** (0–10) verdicts using:

- **Authenticity Scoring**: 6-signal model to identify genuine feedback (specificity, credibility, coherence, timing, uniqueness, sentiment)
- **AI Synthesis**: Groq Gemma 3 12B for bulk processing, Claude Sonnet for final verdict
- **Multi-Source Aggregation**: Combines YouTube (engagement-driven) + Amazon (purchase-verified) signals
- **Time-Weighted Analysis**: Recent reviews weighted higher than old ones
- **India-First Coverage**: Local brands (boAt, Noise, Realme, Mi, Fire-Boltt, Ambrane)

### Why TrustLens?

Fakespot shut down July 2025, leaving 10M+ users without a review intelligence tool. TrustLens fills that gap with:
- India-specific product catalog
- Hindi + English YouTube processing
- Sustainable affiliate revenue model
- Zero "fake review" language (uses "Authenticity Score")

---

## Getting Started

### Prerequisites
- Node.js 25+, npm 11+
- Python 3.11+
- Docker (for local PostgreSQL + Redis)

### Local Development

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -e .
python -m pytest tests/ -v

# Frontend
cd frontend
npm install
npm run dev
# Open http://localhost:3000/in
```

### Architecture

```
TrustLens/
├── backend/               # FastAPI + Python 3.11
│   ├── db/               # SQLAlchemy ORM (PostgreSQL)
│   ├── cache/            # Redis client
│   ├── pipeline/         # Data fetch + AI processing
│   ├── routes/           # API endpoints (/api/v1/search, /api/v1/verdict, /admin/*)
│   ├── workers/          # Background tasks (refresh scheduler)
│   └── tests/            # 49 unit + integration tests
├── frontend/             # Next.js 14 + TypeScript + Tailwind
│   ├── src/app/         # App Router (locale routing, SSR)
│   ├── src/components/  # React components
│   ├── src/lib/         # Utilities, API client, types
│   └── public/          # PWA manifest, robots.txt, sitemap
└── docs/                # Deployment guide, context file
```

---

## Core Features

### Product Pages (9-Section VerdictCard)
1. **Trust Score** (0–10) with confidence tier
2. **AI Summary** (80–120 word verdict from Claude)
3. **Best For / Avoid If** (user profiles)
4. **Pros / Cons** (top 3 each, mention counts)
5. **Feature Scores** (0–10 bars: sound, battery, build, comfort, etc.)
6. **Spec Tags** (confirms/mixed/disputes)
7. **Review Highlights** (3 top reviews with Authenticity Score ≥80)
8. **Source Panel** (YouTube count, Amazon count, auth avg, timestamp)
9. **Alternatives** (related products, placeholder for Week 8+)

### Search & Discovery
- **Homepage**: Hero search + quick picks (boAt, Noise, Mi)
- **Search Results**: Real-time verdicts from API
- **Category Pages**: Quick picks + ranked list + on-demand search
- **Fakespot Alternative**: GTM landing page (targets Fakespot refugees)

### Admin Dashboard (/admin)
- **KPI Cards**: Products, verdicts, misses, cache hit rate, emails
- **Product Table**: All products with trust scores, refresh buttons
- **Search Misses**: Editorial queue (what users searched for)
- **Email List**: Notify-me sign-ups

---

## API Endpoints

### Public
- `POST /api/v1/search` → VerdictCard for a product
- `GET /api/v1/verdict/{locale}/{slug}` → Full verdict
- `POST /api/v1/submit` → Submit product for analysis + email capture

### Admin
- `GET /admin/stats` → KPI dashboard
- `GET /admin/products` → Product index
- `GET /admin/misses` → Search miss queue
- `GET /admin/emails` → Email captures
- `GET /admin/cache` → Cache statistics

### Health
- `GET /api/v1/health` → Service status (DB, Redis, providers)

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS | SSR, PWA, locale routing (/in, /us, /uk) |
| **API Gateway** | FastAPI (Python 3.11) | Async, rate limiting, CORS |
| **AI – Bulk** | Groq Gemma 3 12B | Noise filter, auth scoring, sentiment, themes |
| **AI – Summary** | Claude Sonnet (Anthropic) | Final verdict synthesis (80–120 words) |
| **Cache** | Redis (Upstash free tier) | 72hr TTL, >85% hit rate target |
| **Database** | PostgreSQL (Neon free tier) | Products, verdicts, emails, search misses |
| **Data Sources** | YouTube Data API v3, Rainforest/Oxylabs | Multi-provider with fallback |
| **Auth** | NextAuth.js (Phase 2) | Social login only (no email/password) |
| **Analytics** | Plausible | Privacy-first, $9/month |
| **Monitoring** | Sentry + UptimeRobot | Error tracking + uptime alerts |
| **Hosting** | Vercel (frontend) + Railway (API) | Zero-ops deployment |

---

## Build Status

✅ **All 7 weeks complete:**
- Week 1–3: Backend foundation + AI pipeline
- Week 4: Verdict engine (full pipeline wire-up)
- Week 5: Frontend scaffold (Next.js 14 App Router)
- Week 6: Admin dashboard (5 endpoints)
- Week 7: SEO + polish (JSON-LD, sitemap, robots.txt)
- Week 8: **Launch** (seed products, deployment, QA)

**Test Coverage**: 49 tests passing (FastAPI routes, data fetching, AI processing, verdicts, scheduler)

---

## Legal & Compliance

⚠️ **Core Rule**: Never use "fake review" language. Always "Authenticity Score".

- Methodology page: `/[locale]/methodology` (explains authenticity model)
- No email/password auth (social login only)
- Affiliate revenue model (transparent to users)
- User-submitted products never expose raw data

---

## Development Workflow

### Making Changes
1. Create a branch: `git checkout -b feature/name`
2. Make changes (backend + frontend in parallel)
3. Run tests: `python -m pytest backend/tests/` (49+ passing)
4. Frontend build: `cd frontend && npm run build` (no TS errors)
5. Commit: `git commit -m "message"` (descriptive, no "fake" language)
6. Push + PR

### Adding a New Product Category
1. Update `CATEGORIES` in `frontend/src/lib/locale.ts`
2. Add category route (auto-handled by Next.js dynamic routes)
3. Seed sample products: `python -m backend/scripts/seed_products.py`

### Monitoring
- Admin dashboard: `https://trustlens.in/admin`
- Health check: `curl https://api.trustlens.in/api/v1/health`
- Sentry errors: [Sentry dashboard] (TBD)
- UptimeRobot: [Uptime dashboard] (TBD)

---

## Roadmap

### Phase 2 (Post-Launch)
- [ ] Email notifications (Notify-me triggered when verdict ready)
- [ ] Google OAuth social login
- [ ] Category-specific quick picks + ranked lists
- [ ] Advanced filters (price range, rating, brand)
- [ ] User ratings on verdicts ("Was this helpful?")
- [ ] Affiliate links to Amazon (revenue)

### Phase 3 (6+ months)
- [ ] Expand to US/UK markets (/us, /uk locales)
- [ ] Mobile app (React Native)
- [ ] Browser extension (Fakespot-like)
- [ ] API for partners

---

## Support

- **Bugs**: Report at [GitHub Issues] (TBD)
- **Admin**: `/admin` dashboard
- **Email**: contact@trustlens.in (TBD)
- **Social**: Twitter/LinkedIn (TBD)

---

## License

MIT — See LICENSE file

---

**Made with ❤️ by TrustLens Team**

*"Authentic reviews. Smarter purchases."*
