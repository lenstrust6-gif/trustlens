# Advanced Filters Feature — Executive Summary

**Document Purpose:** Quick reference for stakeholders on the Advanced Filters feature design  
**Date:** 2026-06-06  
**Status:** Design Complete, Ready for Implementation  
**Estimated Timeline:** 3-4 days (1-2 developers)

---

## What We're Building

A comprehensive filter panel for TrustLens search that allows users to refine product results by:

1. **TrustScore Range** — 0–10 (dual slider)
2. **Authenticity Score** — 0–100 (dual slider)
3. **Source Preference** — YouTube, Amazon, or Both
4. **Confidence Tier** — Early / Growing / Established / Mature (multi-select)
5. **Category** — Product categories (if applicable)

Example: _"Show me products with TrustScore ≥ 7.5, Authenticity Score ≥ 70, from YouTube only, in the Established tier."_

---

## Why This Matters

**Current state:** Search returns one product verdict at a time. No browsing or filtering capability.

**With Advanced Filters:** Users can:
- Browse 50+ products at once with filters
- Focus on highest-confidence reviews
- Prefer specific sources (YouTube vs. Amazon)
- Share filter URLs with friends (`/in/search?q=earbuds&trust_min=7.5&source=youtube`)

**Business value:**
- ↑ Session time (users browse instead of bounce)
- ↑ Engagement (filter discovery, sharing)
- ↑ Trust (granular control over what reviews they see)

---

## How It Works

```
User adjusts filters (via UI sliders/buttons)
    ↓
URL params update (e.g., ?trust_min=7.5&auth_min=70)
    ↓
SearchContent reads params, calls API
    ↓
GET /api/v1/products/filter?trust_min=7.5&auth_min=70
    ↓
Backend FilterService applies WHERE clauses to SQL
    ↓
Results returned as product list with verdicts
    ↓
Frontend renders verdict cards
```

**Key design decision:** URL params as source of truth (no Redux/Context). This makes filters:
- Shareable (copy URL → send to friend)
- Bookmarkable
- Browser back/forward compatible
- SSR-friendly

---

## Technical Architecture

### Backend Changes (Minimal)

**Affected files:** 2 (filter_service.py + filters.py)

**New functionality:**
- 4 new methods in FilterService (get_auth_score_range, get_confidence_tiers, get_categories, filter_products update)
- 3 new API endpoints (auth-score-range, confidence-tiers, categories)
- Enhanced filter_products() to support new WHERE clauses

**Database:** Zero changes. All fields (`auth_score_avg`, `confidence_tier`, `source_count_yt`, `source_count_amz`) already exist and are populated by the pipeline.

**Performance:** <100ms queries (with suggested indexes on auth_score_avg, confidence_tier, source counts)

### Frontend Changes (Moderate)

**Architecture:**
```
AdvancedFilters/ (main container)
├── TrustScoreFilter (0-10 dual range slider)
├── AuthScoreFilter (0-100 dual range slider)
├── SourceFilter (radio buttons)
├── ConfidenceTierFilter (checkboxes)
└── FilterChips (active filter display)

useFilters hook (manages URL params)
```

**State management:** URL-based (no local state except debounce buffers)

**Responsive:** Mobile filter modal, desktop sticky sidebar

### Integration

**Search page flow:**
1. User sees filter panel + search input
2. Adjusts filters → URL updates (debounced)
3. SearchContent reads updated URL params
4. Calls API with filter params
5. Results render with applied filters

**No changes to existing search behavior** (single-product /api/v1/search endpoint unchanged).

---

## What Gets Created

### Backend
- 1 test file (test_advanced_filters.py) — 150 LOC
- 0 new models (using existing verdicts table)
- 0 database migrations

### Frontend
- 6 new components (TrustScoreFilter, AuthScoreFilter, SourceFilter, ConfidenceTierFilter, FilterChips, AdvancedFilters) — ~550 LOC
- 1 custom hook (useFilters) — 100 LOC
- 2 test files (component + E2E) — 300 LOC

### Documentation
- ADVANCED_FILTERS.md (feature guide)
- ADVANCED_FILTERS_MIGRATION.md (API changes)
- Updated CLAUDE.md (week 9)

**Total new code: ~1,300 LOC across 11 files**

---

## Key Architectural Decisions

### 1. URL-Based Filter State (Not Redux/Context)

**Why:** 
- Makes filters shareable (copy URL = share filters)
- Browser back/forward work automatically
- SSR-friendly (Next.js can read params)
- No extra dependency

**Tradeoff:**
- Slightly more verbose in components (useSearchParams + useRouter)
- ✅ Worth it for the UX benefits

### 2. Debounced Filter Updates (500ms)

**Why:**
- Slider changes fire many times per second
- Debounce prevents query spam
- User sees updates quickly (500ms feels instant)

**Tradeoff:**
- Slight delay between slider adjustment and results update
- ✅ Better than hammering the database

### 3. Filters Apply to Product Listing, Not Single-Product Search

**Why:**
- Single-product search (/api/v1/search POST) returns a full verdict card from cache
- Filters are meant for browsing multiple products
- Cleaner separation of concerns

**Tradeoff:**
- Users can't filter within a single product's details
- ✅ Acceptable (filters are for discovery, verdict cards are for details)

### 4. Confidence Tier as Checkboxes (Multi-Select)

**Why:**
- Users may want "Established OR Mature" products
- More flexible than single-select

**Tradeoff:**
- Slightly more UI code
- ✅ Worth the flexibility

### 5. Source as Radio Buttons (Single-Select)

**Why:**
- Clear three-way choice: YouTube OR Amazon OR Both
- Less ambiguous than checkboxes

**Design note:** If a product has 0 YouTube reviews and user selects "YouTube Only", it won't appear. This is correct behavior (source preference enforces source availability).

### 6. No "Save Filters" Feature (Phase 1)

**Why:**
- URL serves as simple "save" (bookmark/share)
- Persistent user preferences = Phase 2 (needs NextAuth.js)

**Future enhancement (Phase 2):**
- Save named filter presets ("My budget picks")
- Email alerts: "New products match your filters"

---

## Data Storage

### Database Schema (No Changes)

The verdicts table **already has** all required fields:

```sql
verdict_id          UUID PRIMARY KEY
product_id          UUID FOREIGN KEY
trust_score         DECIMAL(3,1)      ← 0.0 to 10.0
auth_score_avg      DECIMAL(4,1)      ← 0 to 100 (Authenticity Score)
confidence_tier     VARCHAR(20)       ← 'early'|'growing'|'established'|'mature'
source_count_yt     INTEGER           ← YouTube review count
source_count_amz    INTEGER           ← Amazon review count
```

**Populated by:** Backend pipeline during verdict generation (no schema changes needed)

### Recommended Indexes (Optional)

```sql
CREATE INDEX idx_verdicts_auth_score ON verdicts(auth_score_avg);
CREATE INDEX idx_verdicts_tier ON verdicts(confidence_tier);
CREATE INDEX idx_verdicts_sources ON verdicts(source_count_yt, source_count_amz);
```

Expected impact: Query latency 150ms → 30ms (for complex filters)

---

## API Contracts

### New Endpoints

**GET /api/v1/products/auth-score-range**
```
Query: ?locale=in&category=tws-earbuds (optional)
Response: {"min": 45, "max": 95}
```

**GET /api/v1/products/confidence-tiers**
```
Query: ?locale=in&category=tws-earbuds (optional)
Response: {"tiers": ["early", "growing", "established", "mature"]}
```

**GET /api/v1/products/categories**
```
Query: ?locale=in
Response: {"categories": ["tws-earbuds", "smartwatches", "power-banks", ...]}
```

### Updated Endpoints

**GET /api/v1/products/filter** (existing, enhanced)
```
Query parameters:
  locale=in
  category=tws-earbuds (optional)
  trust_score_min=7.5 (optional)
  trust_score_max=10 (optional)
  auth_score_min=70 (NEW)
  auth_score_max=100 (NEW)
  confidence_tiers=established,mature (NEW, comma-separated)
  source=youtube (NEW, values: 'youtube'|'amazon'|'both')
  brands=boAt,Noise (optional)
  sort_by=trust_score_desc (optional)
  limit=50
  offset=0

Response: {
  "status": "ok",
  "products": [...],
  "total": 42,
  "filters": {...}
}
```

**POST /api/v1/search** (unchanged)
- Single-product search
- Filters are now in optional SearchRequest fields
- If no match for single product, filters are ignored
- Returns full verdict card (not product list)

---

## User Experience

### Desktop
```
┌─────────────────────────────────────────┐
│            TrustLens Search             │
├─────────────────────────────────────────┤
│ [Search box]                            │
├────────────────┬────────────────────────┤
│ 🔍 Filters     │  Verdict Card 1       │
│ (4 active)     │  ⭐ Trust: 8.5        │
│                │  ✔ Auth: 82/100      │
│ Trust Score    │  Source: YouTube + Am │
│ [====●====]    │                       │
│ 7.0 - 10.0     │ Verdict Card 2       │
│                │ ⭐ Trust: 7.9        │
│ Auth Score     │ ✔ Auth: 76/100      │
│ [====●====]    │                       │
│ 70 - 100       │                       │
│                │ ...                   │
│ Source         │                       │
│ ○ Both         │                       │
│ ○ YouTube      │                       │
│ ○ Amazon       │                       │
│                │                       │
│ Confidence     │                       │
│ ☑ Early        │                       │
│ ☑ Growing      │                       │
│ ☑ Established  │                       │
│ ☑ Mature       │                       │
│                │                       │
│ [Clear All]    │                       │
└────────────────┴────────────────────────┘
```

### Mobile
```
┌────────────────────────────┐
│  Search       [🔍 Filters]  │  ← Filter button with badge
│  [Search box]              │
│                            │
│ Verdict Card 1             │
│ ⭐ Trust: 8.5             │
│ ✔ Auth: 82/100           │
│                            │
│ Verdict Card 2             │
│ ⭐ Trust: 7.9             │
│ ✔ Auth: 76/100           │
│                            │
│ ...                        │
│                            │
│ ┌──────────────────────┐   │  ← Filter modal (bottom sheet)
│ │ Advanced Filters     │   │
│ │ Trust Score [====●]  │   │
│ │ Auth Score [====●]   │   │
│ │ Source: ○ Both       │   │
│ │         ○ YouTube    │   │
│ │         ○ Amazon     │   │
│ │ Confidence: ☑ All    │   │
│ │ [Clear All]          │   │
│ └──────────────────────┘   │
└────────────────────────────┘
```

---

## Testing Strategy

### Backend Tests (15 total)
- Filter by auth score range (2)
- Filter by confidence tier (2)
- Filter by source (2)
- Combined filters (2)
- Edge cases (empty results, invalid ranges) (3)
- Endpoint integration tests (2)

### Frontend Tests (12 total)
- Component rendering (6)
- URL param sync (3)
- Filter chips display (2)
- Mobile/desktop layouts (1)

### E2E Tests (6 total)
- Search + apply filters + verify results (3 scenarios)
- Clear all filters (1)
- Mobile UX (1)
- Cross-browser (1)

**Coverage target:** >85% for new code

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Filter panel load | <200ms | Fetch metadata endpoints |
| Search results | <100ms | Database query + cache |
| Filter update | 500ms debounce | User feels responsive |
| Page load (no cache) | <2s | Lighthouse requirement |
| Page load (cached) | <500ms | With Redis cache hit |

---

## Rollout Plan

### Stage 1: Internal Testing (Day 5)
- Deploy to staging
- Team of 2-3 tests all scenarios
- Monitor error logs

### Stage 2: Beta (Day 6)
- Deploy to production with 5% traffic
- Monitor error rate (<0.1% target)
- Gather user feedback

### Stage 3: General Availability (Day 7+)
- Roll out to 100%
- Monitor usage stats on admin dashboard
- Plan Phase 2 features

---

## Critical Success Factors

✅ **Do this:**
- Keep filters in URL params (not local state)
- Debounce slider updates (prevent query spam)
- Test on mobile (filter modal UX)
- Verify "no fake review terminology" in code

❌ **Avoid this:**
- Using Redux/Context for filter state
- Unbounded slider changes (no debounce)
- Storing filters in database (except Phase 2 "saved searches")
- Creating new database migrations

---

## Phase 2 Roadmap (Future)

**Not in scope for this implementation, but planned:**

1. **Saved Filters** — Logged-in users can save filter presets
2. **Filter Presets** — "Budget picks" (low price), "Expert picks" (high tier), etc.
3. **Alerts** — Email when new products match saved filters
4. **Comparison** — Side-by-side product comparison
5. **Export** — CSV/JSON export of filtered results
6. **Analytics** — Track which filters are most used

---

## Risk Assessment & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Slow queries | Low | High | Index verdicts table, test with 10k+ products |
| Missing auth_score_avg | Medium | Medium | Default to 0 in FilterService, add validation |
| URL encoding issues | Low | Low | Use URLSearchParams API (automatic encoding) |
| Mobile UX issues | Low | Medium | Test on iPhone, Android, iPad before launch |
| Cache invalidation bugs | Low | Medium | Existing cache layer (72h TTL) handles it |

---

## Team Allocation

**Estimated effort:** 3-4 person-days

**Recommended team:**
- 1 backend engineer (1.5 days)
  - FilterService enhancements
  - Route implementations
  - Tests
  
- 1 frontend engineer (2 days)
  - Component suite
  - Hook implementation
  - Integration testing

- Optional: 0.5 day QA/design review

---

## Decision Log

| Decision | Rationale | Alternative Considered |
|----------|-----------|------------------------|
| URL params for filter state | Shareable, bookmarkable | Redux (more code) |
| Debounce 500ms | Feels instant, prevents spam | 300ms (too fast), 1000ms (feels laggy) |
| Checkbox for tiers | Multi-select flexibility | Single select (less flexible) |
| Confidence tier as filter | Increases search quality | Drop it (less relevant) |
| No saved filters yet | Scope containment | Include in Phase 1 (too much) |

---

## Approval & Sign-off

| Role | Name | Status | Date |
|------|------|--------|------|
| Product Owner | - | ⏳ Pending | - |
| Backend Lead | - | ⏳ Pending | - |
| Frontend Lead | - | ⏳ Pending | - |
| QA Lead | - | ⏳ Pending | - |

---

## Key Documents

1. **ADVANCED_FILTERS_DESIGN.md** — Detailed technical specification (this is the blueprint)
2. **ADVANCED_FILTERS_CHECKLIST.md** — Step-by-step implementation tasks
3. **ADVANCED_FILTERS_MIGRATION.md** — API changes & migration notes
4. **This document** — Executive summary for stakeholders

---

## Next Steps

1. **Review** this summary with team (30 minutes)
2. **Discuss** any concerns or clarifications
3. **Approve** design (get sign-off from leads)
4. **Begin** implementation (Day 1)
5. **Monitor** progress against checklist

---

**Prepared by:** Claude Code (AI Assistant)  
**Date:** 2026-06-06  
**Status:** Ready for Approval & Implementation

For questions, see ADVANCED_FILTERS_DESIGN.md (Questions & Clarifications section).
