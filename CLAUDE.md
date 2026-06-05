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

## Build Status – Week 2 Complete ✓

### Week 1 ✓
- [x] Project scaffolding, FastAPI, database schema, Redis cache, provider abstraction
- [x] Tests: 10 passing

### Week 2 ✓ (just completed)
- [x] YouTubeFetcher: Google Cloud YouTube Data API v3 (search → comments, locale-aware)
- [x] DB Repositories: products, verdicts, misses, emails (async SQLAlchemy)
- [x] Pipeline Orchestrator: parallel fetch, fallback handling, provider selection
- [x] Search route wired: cache → fetch → miss log → return data
- [x] Tests: 25 passing (YouTube, pipeline, cache, repos)

### Next (Week 3 – AI Processing)
- [ ] Groq Gemma 3 12B: noise filter, auth scorer, sentiment, theme extractor
- [ ] Weighted TrustScore calculator
- [ ] Claude Sonnet verdict writer (80–120 words)
- [ ] Verdict card assembly + DB persistence + cache storage

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
