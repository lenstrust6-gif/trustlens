# TrustLens — Claude Code Context File
# Version: 6.0 | June 2026 | Keep this file updated after every session

---

## What This Product Is

TrustLens is an AI-powered product review intelligence portal for India.
It aggregates authentic opinions from YouTube video comments (English + Hindi)
and Amazon.in verified purchase reviews, filters inauthentic signals using a
6-signal Authenticity Scoring model (0–100), and synthesises everything into
structured 9-section Product Verdict Cards.

Core value proposition: the only living tool combining multi-source AI
synthesis + authentic scoring + India-first local brand coverage + Hindi
YouTube processing. Fakespot shut down July 2025 leaving 10M+ users with
no replacement. TrustLens fills that gap with a sustainable affiliate model.

Legal rule #1 (never violate in any code, string, or output):
  NEVER say "fake review" anywhere. Always "Authenticity Score".

---

## Tech Stack

| Layer          | Technology                        | Notes                                     |
|----------------|-----------------------------------|-------------------------------------------|
| Frontend       | Next.js 14 (App Router), TypeScript, Tailwind CSS | SSR for SEO, PWA, locale routing |
| API Gateway    | FastAPI (Python 3.11), async      | Request routing, rate limiting            |
| AI – Bulk      | Gemma 3 12B via Groq API          | Noise filter, auth scoring, sentiment     |
| AI – Summary   | Claude Sonnet (Anthropic API)     | Final 80–120 word verdict only            |
| Cache          | Redis (Upstash – free tier MVP)   | 72hr TTL, target >85% hit rate            |
| Database       | PostgreSQL (Neon – free tier MVP) | Product index, verdicts, emails, misses   |
| Auth (Phase 2) | NextAuth.js + Google OAuth        | Social login only – no email/password ever|
| Analytics      | Plausible                         | Privacy-first, $9/month                   |
| Email          | Resend / SendGrid                 | Notify-me triggered emails                |
| Monitoring     | Sentry + UptimeRobot              | Error tracking + uptime alerts            |
| Hosting        | Vercel (frontend) + Railway (API) | Zero-ops for MVP                          |
| Local dev      | Docker Compose                    | PostgreSQL 16 + Redis                     |

---

## Build Status – Week 4 Complete ✓

### Week 1 ✓
- [x] Project scaffolding, FastAPI, database schema, Redis cache, provider abstraction
- [x] Tests: 10 passing

### Week 2 ✓
- [x] YouTubeFetcher: Google Cloud YouTube Data API v3 (search → comments, locale-aware)
- [x] DB Repositories: products, verdicts, misses, emails (async SQLAlchemy)
- [x] Pipeline Orchestrator: parallel fetch, fallback handling, provider selection
- [x] Tests: 25 passing

### Week 3 ✓
- [x] Groq Gemma 3 12B: noise filter, auth scorer (6-signal), sentiment analysis, theme extractor
- [x] TrustScore calculator: weighted formula (Amazon 45% + YouTube 35% + Auth 20%), time-weighting, tiers
- [x] Claude Sonnet verdict writer (80–120 words) + Gemma fallback
- [x] Tests: 35 passing

### Week 4 ✓
- [x] Orchestrator.run_pipeline() chains all 8 steps
- [x] VerdictCard assembler: full 9-section card
- [x] DB persistence + cache storage
- [x] Routes wired: /api/v1/search and /api/v1/verdict
- [x] Tests: 45 passing

### Week 5 ✓
- [x] Next.js 14 App Router scaffold with TypeScript + Tailwind
- [x] Locale routing (India live, US/UK coming soon)
- [x] Homepage with hero search + quick picks (boAt, Noise, Mi products)
- [x] VerdictCard rendering (9 sections: score, summary, pros/cons, best-for/avoid-if, specs, features, highlights, source)
- [x] Search page with dynamic API integration
- [x] Product page with SSR (server-side verdict fetch)
- [x] PWA manifest + mobile-responsive design
- [x] Build succeeds (Turbopack optimized)

### Week 6 ✓
- [x] **Admin Backend** — 5 endpoints with real DB/Redis queries
  - GET /admin/stats, /products, /misses, /emails, /cache
- [x] **Admin Frontend** — Single-page dashboard at /admin (Overview + Products tabs)
- [x] **Essential Pages** — /methodology (legal), /submit (notify-me), /[category], root → /in redirect
- [x] Repository methods: get_all() for products, verdicts, misses, emails
- [x] 45 tests passing, build clean

### Week 7 ✓ (just completed)
- [x] **SEO** — JSON-LD Review schema on product pages, generateMetadata() with title/description/OG
- [x] **Sitemap** — auto-generated /sitemap.xml (60+ URLs: locales, categories, seed products)
- [x] **Robots.txt** — /robots.txt with crawl rules (disallow /admin, /api)
- [x] **Fakespot Alternative** — /[locale]/fakespot-alternative landing page (GTM, no "fake review" language)
- [x] **Error Pages** — /error.tsx (global boundary), /[locale]/[category]/[product]/not-found.tsx (404)
- [x] **Refresh Scheduler** — backend/workers/refresh_scheduler.py (tiered logic: 48h/168h/720h by age)
- [x] 49 tests passing (+4 scheduler tests), build clean

### Next (Week 8)
- [ ] **Launch** — Pre-seed 50 products, QA, soft launch, Product Hunt

---

## Environment Variables

Backend (.env):
```
DATABASE_URL=postgresql+asyncpg://trustlens:trustlens@localhost:5432/trustlens
REDIS_URL=redis://localhost:6379
CACHE_TTL=259200
REFRESH_PAUSE=false

YOUTUBE_API_KEY=
YOUTUBE_FETCH_LIMIT=200

AMAZON_PROVIDER=rainforest
RAINFOREST_API_KEY=
OXYLABS_USERNAME=
OXYLABS_PASSWORD=

GROQ_API_KEY=
ANTHROPIC_API_KEY=
SUMMARY_MODEL=claude

RESEND_API_KEY=
SENTRY_DSN=

ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

---

## Core Business Rules – Never Violate

1. NEVER say "fake review". Always "Authenticity Score".
2. NEVER build email + password auth. Social login only (Phase 2).
3. ALWAYS check Redis cache before any API call (TTL: 72hr).
4. ALWAYS use Gemma 3 12B (Groq) for bulk. Claude only for final verdict (80–120 words).
5. NEVER expose API keys client-side. Backend .env only.
6. ALWAYS apply time-weighting: weight = max(0.25, 1.0 - (age_months / 24) * 0.75).
7. ALWAYS build RainforestProvider AND OxylabsProvider simultaneously (provider-agnostic).
8. NEVER call a score "Fake". Label: "Authenticity Score: {n}/100".

---

## How to Start a Session

Paste this at the start of every session:

```
I am building TrustLens – see CLAUDE.md for full context.

Current build status:
[paste checked items from above]

Today I am building: [specific component]
Input: [describe input data/props/params]
Expected output: [describe what it should return/render]

Please show me your plan before writing any code.
After building, write tests covering: happy path, empty input,
API failure, and edge cases.
```

---

## How to End a Session

Ask Claude Code to output this summary, then paste it into CLAUDE.md:

```
Please summarise this session:
1. What we built (component names, file paths)
2. Architectural decisions made and why
3. Any issues or technical debt to address
4. What to build next session
5. Any CLAUDE.md sections that need updating
```

---

*TrustLens PRD v6.0 | June 2026 | India-First, Global-Ready*
*Update this file after every Claude Code session.*
