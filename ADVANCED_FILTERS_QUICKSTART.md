# Advanced Filters — Quick Start Guide

**For:** Developers ready to implement  
**Time to read:** 5 minutes  
**Status:** Implementation Ready

---

## The Elevator Pitch

Add a filter panel to the search page so users can filter products by:
- Trust Score (0–10 slider)
- Authenticity Score (0–100 slider)
- Source (YouTube / Amazon / Both)
- Confidence Tier (checkboxes)

**Example:** "Show me products with TrustScore ≥ 7.5 from YouTube only"

---

## Why Build This?

✅ Users can **browse** instead of search one-at-a-time  
✅ Users get **granular control** over what they see  
✅ URLs are **shareable** (`/search?trust_min=7.5&source=youtube`)  
✅ Increases **session time** and **engagement**

---

## Before You Start

### Pre-reqs Checklist

- [ ] Read ADVANCED_FILTERS_DESIGN.md (30 min)
- [ ] Review backend/services/filter_service.py (understand existing FilterService)
- [ ] Review frontend/src/components/AdvancedFilters/ (if exists)
- [ ] Clone/pull latest code
- [ ] Verify backend tests pass: `pytest backend/tests/test_filters.py -v`
- [ ] Verify frontend builds: `npm run build` (from frontend/)

### Tools You'll Need

**Backend:**
- Python 3.11+
- SQLAlchemy (async)
- pytest
- curl or Postman (for API testing)

**Frontend:**
- Node.js 18+
- npm
- React 18
- Next.js 14
- TypeScript

---

## Architecture in 30 Seconds

```
User moves slider
    ↓
useFilters hook updates URL params
    ↓
SearchContent re-renders, calls API
    ↓
GET /api/v1/products/filter?trust_min=7.5
    ↓
Backend FilterService applies WHERE clauses
    ↓
Results rendered as verdict cards
```

**Key design choice:** URL params = source of truth (no Redux/Context needed)

---

## Day-by-Day Plan

### Day 1: Backend (8 hours)

**Goal:** Extend FilterService to support new filter types

**Checklist:**
```
backend/services/filter_service.py:
  [ ] Add get_auth_score_range() method
  [ ] Add get_confidence_tiers() method
  [ ] Add get_categories() method
  [ ] Update filter_products() signature (+4 params)
  [ ] Add auth_score WHERE clauses
  [ ] Add confidence_tier WHERE clauses
  [ ] Add source WHERE clauses

backend/routes/filters.py:
  [ ] Add GET /auth-score-range endpoint
  [ ] Add GET /confidence-tiers endpoint
  [ ] Add GET /categories endpoint

backend/tests/test_advanced_filters.py:
  [ ] Create new test file
  [ ] Add 15 test cases (copy-paste from DESIGN.md)
  [ ] Run tests: pytest backend/tests/test_advanced_filters.py -v
```

**Done when:** All tests pass, no errors in logs

### Day 2: Frontend (8 hours)

**Goal:** Build filter UI components

**Checklist:**
```
frontend/src/lib/hooks/useFilters.ts:
  [ ] Implement hook (read URL params)
  [ ] Implement setters (update URL params)
  [ ] Add debounce logic (500ms)

frontend/src/components/AdvancedFilters/:
  [ ] Create folder
  [ ] TrustScoreFilter.tsx (dual range slider)
  [ ] AuthScoreFilter.tsx (dual range slider)
  [ ] SourceFilter.tsx (radio buttons)
  [ ] ConfidenceTierFilter.tsx (checkboxes)
  [ ] FilterChips.tsx (active filter display)
  [ ] index.tsx (main wrapper)

frontend/src/app/[locale]/search/search-content.tsx:
  [ ] Import AdvancedFilters
  [ ] Add to JSX
  [ ] Test in browser
```

**Done when:** Filters render, URL updates on change

### Day 3: Integration (8 hours)

**Goal:** Wire everything together and test

**Checklist:**
```
frontend/src/lib/api.ts:
  [ ] Add fetchFiltersMetadata() method
  [ ] Add searchWithFilters() method

frontend/src/app/[locale]/search/search-content.tsx:
  [ ] Use new API methods
  [ ] Pass filters to search
  [ ] Render filtered results

Tests:
  [ ] Write frontend unit tests (~12)
  [ ] Write E2E tests (~6)
  [ ] Run tests: npm test + npm run test:e2e

Verification:
  [ ] Search with filters on localhost
  [ ] Verify results filter correctly
  [ ] Check URL params are set
  [ ] Test on mobile
```

**Done when:** End-to-end filter → results flow works

### Day 4: Polish & Deploy (6 hours)

**Goal:** Clean up, document, and prepare for production

**Checklist:**
```
Code Quality:
  [ ] Run linter: ruff check backend/ + eslint frontend/
  [ ] Run type checker: mypy backend/ + tsc frontend/
  [ ] Search for "fake review" (must be 0 matches)

Documentation:
  [ ] Create /docs/ADVANCED_FILTERS.md
  [ ] Create ADVANCED_FILTERS_MIGRATION.md
  [ ] Update CLAUDE.md with Week 9 section

Testing:
  [ ] Test on Chrome, Firefox, Safari
  [ ] Test on mobile (iPhone + Android)
  [ ] Run performance profiling (Lighthouse)

Deployment:
  [ ] Deploy to staging
  [ ] Run full E2E test suite on staging
  [ ] Verify performance (<100ms queries)
  [ ] Get sign-off from team leads
```

**Done when:** Ready for production rollout

---

## File Locations Reference

**Backend:**
- Filter service: `/backend/services/filter_service.py`
- Filter routes: `/backend/routes/filters.py`
- Tests: `/backend/tests/test_advanced_filters.py`

**Frontend:**
- Components: `/frontend/src/components/AdvancedFilters/`
- Hook: `/frontend/src/lib/hooks/useFilters.ts`
- Search page: `/frontend/src/app/[locale]/search/search-content.tsx`
- API client: `/frontend/src/lib/api.ts`

**Documentation:**
- Design: `/ADVANCED_FILTERS_DESIGN.md`
- Checklist: `/ADVANCED_FILTERS_CHECKLIST.md`
- Summary: `/ADVANCED_FILTERS_SUMMARY.md`
- Visuals: `/ADVANCED_FILTERS_VISUALS.md`

---

## Critical Code Snippets

### Backend: FilterService.filter_products() Update

```python
# backend/services/filter_service.py

@staticmethod
async def filter_products(
    session: AsyncSession,
    locale: str,
    # ... existing params ...
    auth_score_min: Optional[int] = None,        # NEW
    auth_score_max: Optional[int] = None,        # NEW
    confidence_tiers: Optional[list[str]] = None, # NEW
    source: str = "both",                         # NEW ('youtube'|'amazon'|'both')
    # ... rest of params ...
) -> dict:
    """Filter and sort products with pagination."""
    stmt = (
        select(ProductModel, VerdictModel)
        .outerjoin(VerdictModel, ProductModel.id == VerdictModel.product_id)
        .where(ProductModel.locale == locale)
    )
    
    filters = []
    
    # Existing filters
    if category:
        filters.append(ProductModel.category == category)
    if trust_score_min is not None:
        filters.append(VerdictModel.trust_score >= Decimal(str(trust_score_min)))
    # ... etc ...
    
    # NEW FILTERS
    if auth_score_min is not None:
        filters.append(VerdictModel.auth_score_avg >= Decimal(str(auth_score_min)))
    
    if auth_score_max is not None:
        filters.append(VerdictModel.auth_score_avg <= Decimal(str(auth_score_max)))
    
    if confidence_tiers:
        filters.append(VerdictModel.confidence_tier.in_(confidence_tiers))
    
    if source == "youtube":
        filters.append(VerdictModel.source_count_yt > 0)
    elif source == "amazon":
        filters.append(VerdictModel.source_count_amz > 0)
    
    # Apply all filters
    if filters:
        stmt = stmt.where(and_(*filters))
    
    # ... rest of existing logic ...
```

### Frontend: useFilters Hook

```typescript
// frontend/src/lib/hooks/useFilters.ts

'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCallback } from 'react'

export const useFilters = (locale: string) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const getParam = (key: string, defaultValue: any) => {
    const value = searchParams.get(key)
    if (value === null) return defaultValue
    return isNaN(Number(value)) ? value : Number(value)
  }
  
  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams)
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })
    
    router.push(`/${locale}/search?${params.toString()}`)
  }
  
  return {
    // Read current values
    trustMin: getParam('trust_min', 0),
    trustMax: getParam('trust_max', 10),
    authMin: getParam('auth_min', 0),
    authMax: getParam('auth_max', 100),
    source: searchParams.get('source') || 'both',
    tiers: searchParams.get('tiers')?.split(',') || [],
    
    // Update handlers
    setTrustRange: (min: number, max: number) => {
      updateParams({
        trust_min: String(min),
        trust_max: String(max),
      })
    },
    
    setAuthRange: (min: number, max: number) => {
      updateParams({
        auth_min: String(min),
        auth_max: String(max),
      })
    },
    
    setSource: (source: string) => {
      updateParams({ source })
    },
    
    setTiers: (tiers: string[]) => {
      updateParams({
        tiers: tiers.length > 0 ? tiers.join(',') : null,
      })
    },
    
    // Utility
    clearAll: () => {
      const params = new URLSearchParams()
      if (searchParams.get('q')) {
        params.set('q', searchParams.get('q')!)
      }
      router.push(`/${locale}/search?${params.toString()}`)
    },
    
    activeCount: () => {
      const count = [
        getParam('trust_min', 0) !== 0,
        getParam('trust_max', 10) !== 10,
        getParam('auth_min', 0) !== 0,
        getParam('auth_max', 100) !== 100,
        searchParams.get('source') !== null,
        searchParams.get('tiers') !== null,
      ].filter(Boolean).length
      return count
    },
  }
}
```

### Frontend: TrustScoreFilter Component

```typescript
// frontend/src/components/AdvancedFilters/TrustScoreFilter.tsx

'use client'
import { useState, useEffect } from 'react'
import { useFilters } from '@/lib/hooks/useFilters'

const debounce = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export default function TrustScoreFilter({ locale }: { locale: string }) {
  const { trustMin, trustMax, setTrustRange } = useFilters(locale)
  const [localMin, setLocalMin] = useState(trustMin)
  const [localMax, setLocalMax] = useState(trustMax)
  
  const debouncedUpdate = useEffect(() => {
    const handler = debounce((min: number, max: number) => {
      setTrustRange(min, max)
    }, 500)
    
    handler(localMin, localMax)
  }, [localMin, localMax, setTrustRange])
  
  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
        Trust Score
      </label>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <input
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={localMin}
          onChange={(e) => setLocalMin(parseFloat(e.target.value))}
          style={{ flex: 1 }}
        />
        <input
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={localMax}
          onChange={(e) => setLocalMax(parseFloat(e.target.value))}
          style={{ flex: 1 }}
        />
      </div>
      
      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
        {localMin.toFixed(1)} — {localMax.toFixed(1)}
      </div>
    </div>
  )
}
```

---

## Common Gotchas & Solutions

### ❌ Problem: Filters don't persist on page reload
**✅ Solution:** Use URL params (already in design), not local state

### ❌ Problem: Slider feels laggy
**✅ Solution:** Debounce updates (500ms). Don't call API on every onChange

### ❌ Problem: "Clear All" doesn't work
**✅ Solution:** Clear all params except `q` (search query should persist)

### ❌ Problem: Mobile filter modal doesn't close
**✅ Solution:** Add onClick to backdrop, add Escape key listener

### ❌ Problem: Tests fail with "fake review" terminology
**✅ Solution:** Replace "fake" with "Authenticity Score" everywhere

---

## Testing Checklist

### Before Committing

```bash
# Backend
pytest backend/tests/test_advanced_filters.py -v    # All pass?
ruff check backend/                                  # Zero errors?
mypy backend/services/filter_service.py              # Type safe?

# Frontend
npm test -- AdvancedFilters                          # Unit tests pass?
eslint frontend/src/components/AdvancedFilters/      # Zero errors?
tsc --noEmit                                         # Type safe?

# Integration
npx playwright test advanced-filters.spec.ts         # E2E tests pass?

# Final check
grep -r "fake review" .                              # Zero matches?
```

### Manual Testing

```
[ ] Search page loads
[ ] Filter panel visible (desktop sidebar or mobile button)
[ ] Adjust trust score slider → URL updates
[ ] Select source → URL updates
[ ] Click checkboxes → URL updates
[ ] Results filter correctly
[ ] Clear All button works
[ ] Mobile modal works
[ ] URLs are shareable
```

---

## Deployment Checklist

**Staging (Day 5):**
```
[ ] Deploy backend to staging
[ ] Deploy frontend to staging
[ ] Run full E2E test suite
[ ] Test on mobile devices
[ ] Monitor error logs (Sentry)
[ ] Load test: 100 concurrent requests
```

**Production (Day 6+):**
```
[ ] Get sign-off from leads
[ ] Deploy to production (canary: 5% traffic)
[ ] Monitor error rate (<0.1%)
[ ] Monitor query latency (<100ms)
[ ] Monitor usage stats
[ ] Roll out to 100%
```

---

## Getting Help

| Question | Answer | Document |
|----------|--------|----------|
| What's the overall design? | See detailed spec | ADVANCED_FILTERS_DESIGN.md |
| What do I build today? | See step-by-step tasks | ADVANCED_FILTERS_CHECKLIST.md |
| How does it work conceptually? | See data flow & UX | ADVANCED_FILTERS_VISUALS.md |
| What's a quick summary? | See executive summary | ADVANCED_FILTERS_SUMMARY.md |

---

## Pro Tips

1. **Start with backend tests** — Verify FilterService changes work before building UI
2. **Use existing styles** — Match dark theme of current components (var(--bg), var(--text-primary))
3. **Copy-paste from DESIGN.md** — All test cases, SQL examples, and code snippets are ready to use
4. **Test on mobile early** — Don't wait until Day 4 to discover filter modal UX issues
5. **Monitor Sentry** — Check for errors during staging before production rollout

---

## Success Looks Like

✅ All tests passing (backend + frontend + E2E)  
✅ Filters update URL params  
✅ Results filter correctly  
✅ Mobile UX smooth  
✅ Query latency <100ms  
✅ Zero "fake review" terminology  
✅ Documentation complete  
✅ Team sign-off obtained

---

**You've got this! 🚀**

Start with Day 1 (backend), follow the checklist, and reference ADVANCED_FILTERS_DESIGN.md when you get stuck.

Questions? Check the "Known Limitations & Future Work" section in ADVANCED_FILTERS_DESIGN.md.

---

**Last Updated:** 2026-06-06  
**Version:** 1.0  
**Status:** Ready to Implement
