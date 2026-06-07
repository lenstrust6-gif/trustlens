# Advanced Filters Feature Design
## TrustLens Search Enhancement

**Status:** Design Document (Ready for 3-4 day implementation)  
**Last Updated:** 2026-06-06  
**Estimated Complexity:** Medium (building on existing FilterService)

---

## Executive Summary

This document outlines the design for adding advanced filtering capabilities to the TrustLens search page. The feature enhances the existing `/[locale]/search` page with a comprehensive filter panel supporting:

1. **TrustScore Range** (0-10 slider)
2. **Authenticity Score** (0-100 slider)
3. **Source Preference** (YouTube, Amazon, Both)
4. **Confidence Tier** (Early/Growing/Established/Mature)
5. **Category** (if searching across products)

**Advantage:** Much of the backend infrastructure (FilterService) already exists. We're extending it to support new filter types and integrating into the search flow.

---

## Architecture Overview

```
Frontend (Next.js 14 + React 18)
├── /[locale]/search/page.tsx (server component)
├── /[locale]/search/search-content.tsx (client component)
├── /components/AdvancedFilters/ (NEW)
│   ├── index.tsx (main component + state)
│   ├── TrustScoreFilter.tsx (slider)
│   ├── AuthScoreFilter.tsx (slider)
│   ├── SourceFilter.tsx (radio buttons)
│   ├── ConfidenceTierFilter.tsx (checkboxes)
│   ├── FilterChips.tsx (active filters display)
│   └── FilterMetadata.tsx (min/max/available values)
└── /lib/hooks/useFilters.ts (custom hook for URL state)

Backend (FastAPI + SQLAlchemy)
├── /routes/search.py (EXTEND: add filter params)
├── /services/filter_service.py (EXTEND: new methods)
├── /db/models.py (NO CHANGES - fields exist)
└── /db/repositories/ (NO CHANGES)

Database
└── verdicts table (already has: auth_score_avg, confidence_tier, source_count_yt, source_count_amz)
```

---

## Database Schema (Already Exists)

### Key Fields in `verdicts` Table

```sql
trust_score         DECIMAL(3,1)      -- 0.0 to 10.0
auth_score_avg      DECIMAL(4,1)      -- 0 to 100 (aggregated authenticity)
confidence_tier     VARCHAR(20)       -- 'early' | 'growing' | 'established' | 'mature'
source_count_yt     INTEGER           -- YouTube comment count
source_count_amz    INTEGER           -- Amazon review count
```

**No database migrations needed.** All fields exist and are populated by the pipeline.

---

## Implementation Plan (3-4 Days)

### Day 1: Backend Enhancement (8-10 hours)

#### 1.1 Extend FilterService (`backend/services/filter_service.py`)

**New static methods to add:**

```python
@staticmethod
async def get_auth_score_range(
    session: AsyncSession,
    locale: str,
    category: Optional[str] = None,
) -> dict:
    """Return min/max auth scores for slider range."""
    # SELECT MIN(auth_score_avg), MAX(auth_score_avg) FROM verdicts
    # JOIN products WHERE products.locale = locale
    return {"min": 0, "max": 100}  # Always 0-100 scale

@staticmethod
async def get_confidence_tiers(
    session: AsyncSession,
    locale: str,
    category: Optional[str] = None,
) -> list[str]:
    """Return available confidence tiers."""
    # SELECT DISTINCT confidence_tier FROM verdicts
    return ["early", "growing", "established", "mature"]

@staticmethod
async def get_categories(
    session: AsyncSession,
    locale: str,
) -> list[str]:
    """Return available categories."""
    # SELECT DISTINCT category FROM products
```

**Update existing `filter_products()` method:**

```python
@staticmethod
async def filter_products(
    session: AsyncSession,
    locale: str,
    category: Optional[str] = None,
    trust_score_min: Optional[float] = None,
    trust_score_max: Optional[float] = None,
    auth_score_min: Optional[int] = None,        # NEW
    auth_score_max: Optional[int] = None,        # NEW
    confidence_tiers: Optional[list[str]] = None, # NEW
    source: str = "both",                         # NEW ('youtube', 'amazon', 'both')
    brands: Optional[list[str]] = None,
    sort_by: str = "trust_score_desc",
    limit: int = 50,
    offset: int = 0,
) -> dict:
    """Enhanced filtering with auth score, confidence tier, and source filters."""
    
    # Existing logic + new WHERE clauses:
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
    # 'both' = no additional filter (both counts can be > 0)
    
    # Rest of existing logic...
```

#### 1.2 Extend Filter Routes (`backend/routes/filters.py`)

Add new endpoints:

```python
@router.get("/auth-score-range")
async def get_auth_score_range(
    locale: str = Query("in"),
    category: Optional[str] = Query(None),
    db=None,
):
    """Get auth score range for slider."""
    return {"min": 0, "max": 100}

@router.get("/confidence-tiers")
async def get_confidence_tiers(
    locale: str = Query("in"),
    category: Optional[str] = Query(None),
    db=None,
):
    """Get available confidence tiers."""
    # async with db.session() as session:
    #     tiers = await FilterService.get_confidence_tiers(...)
    return {"tiers": ["early", "growing", "established", "mature"]}

@router.get("/categories")
async def get_categories(
    locale: str = Query("in"),
    db=None,
):
    """Get available categories."""
    # async with db.session() as session:
    #     cats = await FilterService.get_categories(...)
    return {"categories": [...]}
```

#### 1.3 Update Search Route (`backend/routes/search.py`)

**Extend SearchRequest model:**

```python
class SearchRequest(BaseModel):
    product_name: str
    locale: str = "in"
    trust_score_min: Optional[float] = None        # NEW
    trust_score_max: Optional[float] = None        # NEW
    auth_score_min: Optional[int] = None           # NEW
    auth_score_max: Optional[int] = None           # NEW
    confidence_tiers: Optional[list[str]] = None   # NEW
    source: str = "both"                           # NEW
```

**Update `/api/v1/search` endpoint:**

```python
@router.post("/api/v1/search")
async def search(request: SearchRequest, session: AsyncSession = Depends(get_db_session)):
    """Search with advanced filters."""
    
    # Check cache (unchanged)
    cached_verdict = await get_verdict(request.locale, request.product_name_slug)
    if cached_verdict:
        # Apply filters to cached result? Or skip filtering for single product?
        # Decision: Skip filtering for single-product search (cache hit is a full verdict)
        return cached_verdict
    
    # Run pipeline (unchanged)
    verdict_card = await run_pipeline(...)
    return verdict_card
```

**Note:** Single-product search (via `/api/v1/search` POST) doesn't filter. The new filters apply to **browse/list** searches via `/api/v1/products/filter` or new `/api/v1/search-advanced` endpoint.

#### 1.4 Add Tests (`backend/tests/test_filters.py`)

```python
@pytest.mark.asyncio
async def test_filter_by_auth_score_range(self, db_session, sample_products):
    """Test filtering by authenticity score."""
    # Insert verdicts with different auth_score_avg values
    # Query with auth_score_min=70, auth_score_max=90
    # Assert results fall within range

@pytest.mark.asyncio
async def test_filter_by_confidence_tier(self, db_session, sample_products):
    """Test filtering by confidence tier."""
    # Query with confidence_tiers=['established', 'mature']
    # Assert all results have those tiers

@pytest.mark.asyncio
async def test_filter_by_source_youtube_only(self, db_session, sample_products):
    """Test filtering by YouTube source only."""
    # Query with source='youtube'
    # Assert all results have source_count_yt > 0

@pytest.mark.asyncio
async def test_combined_advanced_filters(self, db_session, sample_products):
    """Test combining trust score, auth score, tier, source."""
    # All filters together
```

**Tests to add: ~8 new test cases, ~100 LOC**

---

### Day 2: Frontend Components (8-10 hours)

#### 2.1 Create AdvancedFilters Directory Structure

```
/components/AdvancedFilters/
├── index.tsx                  (main wrapper + state)
├── TrustScoreFilter.tsx        (0-10 dual range slider)
├── AuthScoreFilter.tsx         (0-100 dual range slider)
├── SourceFilter.tsx            (radio: YouTube / Amazon / Both)
├── ConfidenceTierFilter.tsx    (multi-checkbox)
├── FilterChips.tsx             (display active filters as chips)
├── FilterMetadata.tsx          (load and manage min/max values)
└── styles.ts                   (shared filter styles)
```

#### 2.2 Create `useFilters` Hook (`lib/hooks/useFilters.ts`)

```typescript
/**
 * Hook to manage filter state via URL params.
 * Syncs with useSearchParams() and useRouter().
 */
export const useFilters = (locale: string) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  return {
    // Current filter values
    trustMin: parseFloat(searchParams.get('trust_min') || '0'),
    trustMax: parseFloat(searchParams.get('trust_max') || '10'),
    authMin: parseInt(searchParams.get('auth_min') || '0'),
    authMax: parseInt(searchParams.get('auth_max') || '100'),
    source: searchParams.get('source') || 'both',
    tiers: searchParams.get('tiers')?.split(',') || [],
    category: searchParams.get('category'),
    
    // Update single filter
    setTrustRange: (min: number, max: number) => {
      const params = new URLSearchParams(searchParams)
      params.set('trust_min', min.toString())
      params.set('trust_max', max.toString())
      router.push(`?${params.toString()}`)
    },
    
    setAuthRange: (min: number, max: number) => { ... },
    setSource: (source: string) => { ... },
    setTiers: (tiers: string[]) => { ... },
    
    // Clear all filters
    clearAll: () => {
      const params = new URLSearchParams()
      if (searchParams.get('q')) {
        params.set('q', searchParams.get('q')!)
      }
      router.push(`?${params.toString()}`)
    },
    
    // Active filter count
    activeCount: () => { /* count non-default values */ },
  }
}
```

#### 2.3 Component Implementation

**TrustScoreFilter.tsx:**
```typescript
'use client'
import { useState, useCallback, useEffect } from 'react'

export default function TrustScoreFilter() {
  const { trustMin, trustMax, setTrustRange } = useFilters(locale)
  const [localMin, setLocalMin] = useState(trustMin)
  const [localMax, setLocalMax] = useState(trustMax)
  
  // Debounced update
  const debouncedUpdate = useCallback(
    debounce((min: number, max: number) => {
      setTrustRange(min, max)
    }, 500),
    [setTrustRange]
  )
  
  useEffect(() => {
    debouncedUpdate(localMin, localMax)
  }, [localMin, localMax])
  
  return (
    <div style={filterContainerStyle}>
      <label>Trust Score</label>
      <div style={sliderContainerStyle}>
        <input
          type="range"
          min="0" max="10" step="0.5"
          value={localMin}
          onChange={(e) => setLocalMin(parseFloat(e.target.value))}
        />
        <input
          type="range"
          min="0" max="10" step="0.5"
          value={localMax}
          onChange={(e) => setLocalMax(parseFloat(e.target.value))}
        />
      </div>
      <div style={rangeDisplayStyle}>
        {localMin.toFixed(1)} - {localMax.toFixed(1)}
      </div>
    </div>
  )
}
```

**AuthScoreFilter.tsx:** (Similar structure, 0-100 scale)

**SourceFilter.tsx:**
```typescript
'use client'
export default function SourceFilter() {
  const { source, setSource } = useFilters(locale)
  
  return (
    <div style={filterContainerStyle}>
      <label>Source Preference</label>
      <div style={radioGroupStyle}>
        {[
          { value: 'both', label: 'Both (YouTube + Amazon)' },
          { value: 'youtube', label: 'YouTube Only' },
          { value: 'amazon', label: 'Amazon Only' },
        ].map(option => (
          <label key={option.value}>
            <input
              type="radio"
              name="source"
              value={option.value}
              checked={source === option.value}
              onChange={(e) => setSource(e.target.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  )
}
```

**ConfidenceTierFilter.tsx:**
```typescript
'use client'
export default function ConfidenceTierFilter() {
  const { tiers, setTiers } = useFilters(locale)
  const availableTiers = ['early', 'growing', 'established', 'mature']
  
  const toggle = (tier: string) => {
    if (tiers.includes(tier)) {
      setTiers(tiers.filter(t => t !== tier))
    } else {
      setTiers([...tiers, tier])
    }
  }
  
  return (
    <div style={filterContainerStyle}>
      <label>Confidence Tier</label>
      <div style={checkboxGroupStyle}>
        {availableTiers.map(tier => (
          <label key={tier}>
            <input
              type="checkbox"
              checked={tiers.includes(tier)}
              onChange={() => toggle(tier)}
            />
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </label>
        ))}
      </div>
    </div>
  )
}
```

**FilterChips.tsx:**
```typescript
'use client'
export default function FilterChips() {
  const { trustMin, authMax, source, tiers, clearAll } = useFilters(locale)
  const chips = [
    trustMin !== 0 && { label: `Trust Score ≥ ${trustMin}`, type: 'trust' },
    authMax !== 100 && { label: `Auth Score ≤ ${authMax}`, type: 'auth' },
    source !== 'both' && { label: `${source.charAt(0).toUpperCase()}${source.slice(1)} Only`, type: 'source' },
    tiers.length > 0 && { label: `${tiers.length} Tier${tiers.length > 1 ? 's' : ''}`, type: 'tier' },
  ].filter(Boolean)
  
  if (chips.length === 0) return null
  
  return (
    <div style={chipsContainerStyle}>
      {chips.map((chip, i) => (
        <div key={i} style={chipStyle}>{chip.label} ✕</div>
      ))}
      <button onClick={clearAll} style={clearAllButtonStyle}>
        Clear All
      </button>
    </div>
  )
}
```

**AdvancedFilters/index.tsx:**
```typescript
'use client'
export default function AdvancedFilters({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false)
  const { activeCount } = useFilters(locale)
  
  return (
    <>
      {/* Mobile filter toggle button */}
      <button
        onClick={() => setOpen(!open)}
        style={mobileFilterButtonStyle}
      >
        🔍 Filters {activeCount() > 0 && `(${activeCount()})`}
      </button>
      
      {/* Filter panel */}
      <div style={filterPanelStyle(open)}>
        <h3>Advanced Filters</h3>
        <TrustScoreFilter />
        <AuthScoreFilter />
        <SourceFilter />
        <ConfidenceTierFilter />
      </div>
      
      {/* Active filter chips */}
      <FilterChips />
    </>
  )
}
```

#### 2.4 Integrate into Search Page (`frontend/src/app/[locale]/search/search-content.tsx`)

```typescript
// Add import
import AdvancedFilters from '@/components/AdvancedFilters'

// In component:
export default function SearchContent({ locale }: SearchContentProps) {
  // ... existing code ...
  
  return (
    <div style={containerStyle}>
      <h1>Search Products</h1>
      
      {/* New filter panel */}
      <AdvancedFilters locale={locale} />
      
      {/* Existing search input */}
      <input type="text" placeholder="Search products..." />
      
      {/* Results grid */}
      {verdicts.map(v => <VerdictCard key={v.id} card={v} />)}
    </div>
  )
}
```

---

### Day 3: API Integration & Testing (8-10 hours)

#### 3.1 Update API Client (`frontend/src/lib/api.ts`)

```typescript
export const api = {
  // Existing methods...
  
  async fetchFiltersMetadata(locale: string) {
    const [trustRange, authRange, tiers, brands] = await Promise.all([
      fetch(`/api/v1/products/trust-score-range?locale=${locale}`).then(r => r.json()),
      fetch(`/api/v1/products/auth-score-range?locale=${locale}`).then(r => r.json()),
      fetch(`/api/v1/products/confidence-tiers?locale=${locale}`).then(r => r.json()),
      fetch(`/api/v1/products/brands?locale=${locale}`).then(r => r.json()),
    ])
    return { trustRange, authRange, tiers, brands }
  },
  
  async searchWithFilters(params: {
    q?: string
    locale: string
    trust_score_min?: number
    trust_score_max?: number
    auth_score_min?: number
    auth_score_max?: number
    confidence_tiers?: string[]
    source?: string
    limit?: number
    offset?: number
  }) {
    const response = await fetch(`/api/v1/products/search`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Build query string from params
    })
    return response.json()
  },
}
```

#### 3.2 Integration Tests

**File: `/backend/tests/test_advanced_filters.py` (new)**

```python
"""Tests for advanced filtering."""
import pytest
from decimal import Decimal

class TestAdvancedFilters:
    """Test advanced filter combinations."""
    
    @pytest.mark.asyncio
    async def test_trust_and_auth_filters_combined(self, db_session, sample_products):
        """Test combining trust score and auth score filters."""
        results = await FilterService.filter_products(
            session=db_session,
            locale="in",
            trust_score_min=7.5,
            auth_score_min=70,
        )
        assert all(p["trustScore"] >= 7.5 for p in results["products"])
        # Note: auth_score_avg may not be set in sample data, adjust test
    
    @pytest.mark.asyncio
    async def test_confidence_tier_filter(self, db_session, sample_products):
        """Test filtering by confidence tier."""
        results = await FilterService.filter_products(
            session=db_session,
            locale="in",
            confidence_tiers=["established", "mature"],
        )
        assert all(p["confidenceTier"] in ["established", "mature"] 
                   for p in results["products"])
    
    @pytest.mark.asyncio
    async def test_source_youtube_only_filter(self, db_session, sample_products):
        """Test YouTube-only source filter."""
        results = await FilterService.filter_products(
            session=db_session,
            locale="in",
            source="youtube",
        )
        # All results must have YouTube reviews
        assert all(p["sourceCountYT"] > 0 for p in results["products"])
    
    @pytest.mark.asyncio
    async def test_source_amazon_only_filter(self, db_session, sample_products):
        """Test Amazon-only source filter."""
        results = await FilterService.filter_products(
            session=db_session,
            locale="in",
            source="amazon",
        )
        assert all(p["sourceCountAMZ"] > 0 for p in results["products"])
    
    @pytest.mark.asyncio
    async def test_all_filters_combined(self, db_session, sample_products):
        """Test all filters combined."""
        results = await FilterService.filter_products(
            session=db_session,
            locale="in",
            trust_score_min=7.5,
            trust_score_max=8.5,
            confidence_tiers=["established"],
            source="both",
            sort_by="trust_score_desc",
        )
        # Verify filters applied
        assert all(7.5 <= p["trustScore"] <= 8.5 for p in results["products"])
        assert all(p["confidenceTier"] == "established" for p in results["products"])
```

**File: `/frontend/__tests__/components/AdvancedFilters.test.tsx` (new)**

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import AdvancedFilters from '@/components/AdvancedFilters'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams('locale=in'),
}))

describe('AdvancedFilters', () => {
  it('renders filter panels', () => {
    render(<AdvancedFilters locale="in" />)
    expect(screen.getByText('Trust Score')).toBeInTheDocument()
    expect(screen.getByText('Authenticity Score')).toBeInTheDocument()
  })
  
  it('updates URL params when filter changes', () => {
    render(<AdvancedFilters locale="in" />)
    // Simulate changing trust score slider
    fireEvent.change(screen.getByRole('slider', { name: /trust/i }), {
      target: { value: '7' }
    })
    // Assert router.push called with updated params
  })
  
  it('displays active filter count', () => {
    render(<AdvancedFilters locale="in" />)
    // With mocked params containing filters
    expect(screen.getByText(/active filter/i)).toBeInTheDocument()
  })
})
```

#### 3.3 E2E Tests (Playwright)

**File: `/frontend/e2e/search-with-filters.spec.ts` (new)**

```typescript
import { test, expect } from '@playwright/test'

test('search with advanced filters', async ({ page }) => {
  await page.goto('/in/search')
  
  // Set trust score filter
  await page.fill('[aria-label="Trust Score Min"]', '7.5')
  
  // Select source preference
  await page.click('label:has-text("YouTube Only")')
  
  // Verify URL params updated
  await expect(page).toHaveURL(/trust_min=7\.5/)
  await expect(page).toHaveURL(/source=youtube/)
  
  // Verify results filtered
  const cards = page.locator('[role="article"]')
  expect(await cards.count()).toBeGreaterThan(0)
})

test('clear all filters', async ({ page }) => {
  await page.goto('/in/search?trust_min=7.5&auth_min=70')
  
  // Click clear button
  await page.click('button:has-text("Clear All")')
  
  // Verify URL reset
  await expect(page).toHaveURL('/in/search')
})
```

---

### Day 4: Polish & Documentation (6-8 hours)

#### 4.1 Styling & Responsive Design

Update `AdvancedFilters/styles.ts`:

```typescript
export const styles = {
  filterPanel: {
    desktop: {
      width: '280px',
      position: 'sticky' as const,
      top: '20px',
      borderRadius: '12px',
      background: 'var(--surface)',
      padding: '24px',
      border: '1px solid var(--border)',
    },
    mobile: {
      position: 'fixed' as const,
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: '80vh',
      borderRadius: '16px 16px 0 0',
      zIndex: 40,
      animation: 'slideUp 300ms ease-out',
    },
  },
  slider: {
    track: { background: 'var(--border)' },
    thumb: { background: 'var(--accent)', cursor: 'pointer' },
  },
  chips: {
    container: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap' as const,
      marginBottom: '16px',
    },
    chip: {
      padding: '6px 12px',
      borderRadius: '20px',
      background: 'var(--accent-light)',
      fontSize: '12px',
      fontWeight: 600,
    },
  },
}
```

**Dark theme support:** Already using `var(--bg)`, `var(--text-primary)`, etc.

#### 4.2 Documentation

**File: `/docs/ADVANCED_FILTERS.md` (new)**

```markdown
# Advanced Filters Feature

## Overview

Allows users to refine search results using 5 filter types:

1. **Trust Score** (0-10 range slider)
2. **Authenticity Score** (0-100 range slider)
3. **Source Preference** (YouTube / Amazon / Both)
4. **Confidence Tier** (Early / Growing / Established / Mature)
5. **Category** (product categories)

## URL Structure

```
/in/search?q=earbuds&trust_min=7&trust_max=10&auth_min=70&source=youtube&tiers=established,mature
```

Query parameters:
- `q` - Search query
- `trust_min`, `trust_max` - Trust score range (0-10)
- `auth_min`, `auth_max` - Authenticity score range (0-100)
- `source` - 'youtube' | 'amazon' | 'both'
- `tiers` - Comma-separated confidence tiers
- `category` - Product category

## Backend Integration

### POST /api/v1/search (unchanged)
Single-product search, returns full verdict card.

### GET /api/v1/products/filter
Browse and filter products with advanced filters.

Query parameters: same as URL structure above.

Response:
```json
{
  "status": "ok",
  "products": [...],
  "total": 42,
  "filters": {...}
}
```

## Frontend Components

- `AdvancedFilters` - Main wrapper
- `TrustScoreFilter` - Dual range slider
- `AuthScoreFilter` - Dual range slider  
- `SourceFilter` - Radio buttons
- `ConfidenceTierFilter` - Multi-checkbox
- `FilterChips` - Active filter display

## State Management

Uses URL params as source of truth (no Redux/Context):

```typescript
const { trustMin, trustMax, setTrustRange } = useFilters(locale)
```

Benefits:
- Shareable filter URLs
- Browser back/forward work correctly
- SSR friendly
```

#### 4.3 Migration Guide

**File: `/ADVANCED_FILTERS_MIGRATION.md` (new)**

```markdown
# Migration Guide: Advanced Filters

## For Existing Users

Your saved searches and bookmarks will still work:
- Old URL: `/in/search?q=earbuds` → Same result
- New filters are **optional**

## API Changes

### Breaking Changes
None. All new functionality is additive.

### Deprecated
Nothing.

### New Endpoints

```
GET /api/v1/products/auth-score-range?locale=in&category=...
GET /api/v1/products/confidence-tiers?locale=in
GET /api/v1/products/categories?locale=in
```

### Updated Endpoints

```
GET /api/v1/products/filter
  # New parameters:
  - auth_score_min
  - auth_score_max
  - confidence_tiers (comma-separated)
  - source ('youtube' | 'amazon' | 'both')
```

## Frontend Changes

**Old search component:**
```typescript
<SearchContent query={query} />
```

**New search component:**
```typescript
<SearchContent query={query} locale={locale} />
<AdvancedFilters locale={locale} />
```

Both work independently.
```

#### 4.4 Update CLAUDE.md

Add to "Week 9" section (when implementing):

```markdown
### Week 9 - Advanced Filters (IN PROGRESS)
- [ ] Backend: FilterService enhancements (auth_score, confidence_tier, source)
- [ ] Backend: New routes (/auth-score-range, /confidence-tiers, /categories)
- [ ] Frontend: AdvancedFilters component suite (6 components)
- [ ] Frontend: useFilters hook for URL state management
- [ ] Frontend: Integration with search-content.tsx
- [ ] Tests: 12+ backend filter tests + 4 frontend component tests
- [ ] Docs: ADVANCED_FILTERS.md + MIGRATION.md
```

---

## Critical Files to Create/Modify

### **CREATE (New Files)**

1. `/backend/tests/test_advanced_filters.py` (150 LOC)
2. `/frontend/src/components/AdvancedFilters/index.tsx` (120 LOC)
3. `/frontend/src/components/AdvancedFilters/TrustScoreFilter.tsx` (80 LOC)
4. `/frontend/src/components/AdvancedFilters/AuthScoreFilter.tsx` (80 LOC)
5. `/frontend/src/components/AdvancedFilters/SourceFilter.tsx` (60 LOC)
6. `/frontend/src/components/AdvancedFilters/ConfidenceTierFilter.tsx` (70 LOC)
7. `/frontend/src/components/AdvancedFilters/FilterChips.tsx` (70 LOC)
8. `/frontend/src/lib/hooks/useFilters.ts` (100 LOC)
9. `/frontend/__tests__/components/AdvancedFilters.test.tsx` (150 LOC)
10. `/docs/ADVANCED_FILTERS.md` (documentation)
11. `/ADVANCED_FILTERS_MIGRATION.md` (migration guide)

### **MODIFY (Extend Existing)**

1. `/backend/services/filter_service.py` (add 4 methods, ~80 LOC)
2. `/backend/routes/filters.py` (add 3 endpoints, ~80 LOC)
3. `/backend/routes/search.py` (update SearchRequest, ~20 LOC)
4. `/frontend/src/app/[locale]/search/search-content.tsx` (add AdvancedFilters import, ~10 LOC)
5. `/frontend/src/lib/api.ts` (add methods, ~50 LOC)

**Total: ~1,300 LOC across 16 files**

---

## Data Flow Diagram

```
User Input
    ↓
AdvancedFilters (React Components)
    ↓ useFilters hook
URL Params Update (Next.js Router)
    ↓
SearchContent component reads params
    ↓
api.searchWithFilters()
    ↓
GET /api/v1/products/filter?trust_min=7&auth_min=70&source=youtube
    ↓
Backend FilterService.filter_products()
    ↓
SQL WHERE clauses:
  - auth_score_avg >= :auth_min
  - confidence_tier IN (:tiers)
  - source_count_yt > 0 (if source='youtube')
    ↓
Results returned as ProductModel[] + VerdictModel[]
    ↓
Frontend formats and displays verdict cards
```

---

## Testing Strategy

### Unit Tests (Backend)

- Test each filter type independently (8 tests)
- Test filter combinations (4 tests)
- Test edge cases (empty results, invalid ranges) (3 tests)
- **Total: 15 backend tests**

### Component Tests (Frontend)

- Render each filter component (6 tests)
- Test URL state sync (3 tests)
- Test filter chip display (2 tests)
- **Total: 11 frontend tests**

### Integration Tests

- E2E: Search → Apply filters → Verify results (2 tests)
- E2E: Clear all filters → Verify reset (1 test)
- Cross-browser: Desktop & mobile UX (covered in E2E)
- **Total: 3 integration tests**

**Coverage Target: >85% for new code**

---

## Performance Considerations

### Database Query Optimization

1. **Index the verdict table:**
   ```sql
   CREATE INDEX idx_verdicts_auth_score ON verdicts(auth_score_avg);
   CREATE INDEX idx_verdicts_tier ON verdicts(confidence_tier);
   CREATE INDEX idx_verdicts_sources ON verdicts(source_count_yt, source_count_amz);
   ```

2. **Query pattern:**
   ```sql
   SELECT products.*, verdicts.* 
   FROM products 
   JOIN verdicts ON products.id = verdicts.product_id
   WHERE products.locale = 'in'
     AND verdicts.auth_score_avg >= 70
     AND verdicts.confidence_tier IN ('established', 'mature')
   ORDER BY verdicts.trust_score DESC
   LIMIT 50;
   ```

3. **Expected execution time: <100ms** (with Redis cache, <10ms cache hit)

### Frontend Optimization

1. **Debounce filter changes:** 500ms
2. **Lazy load filter metadata:** Fetch only when filter panel opens
3. **Memoize filter components:** Prevent unnecessary re-renders
4. **URL state only:** No Redux, Context, or local state (except debounce buffers)

### Cache Strategy

- Filter metadata (brands, tiers, ranges) → 24h TTL
- Search results → existing 72h TTL

---

## Rollout Plan

### Phase 1: Internal Testing (Day 5)
- Deploy to staging
- Manual testing on desktop + mobile
- Load testing with 100+ concurrent filters

### Phase 2: Beta Release (Day 6)
- Deploy to production (5% traffic)
- Monitor Sentry for errors
- Gather user feedback

### Phase 3: Full Release (Day 7+)
- Roll out to 100% of users
- Monitor admin dashboard stats
- Plan Phase 2 enhancements (saved filters, email alerts)

---

## Known Limitations & Future Work

### Current Scope
- Filters apply to **product listing only**, not single-product search
- No "saved filters" feature (Phase 2)
- No "similar products" recommendations (Phase 2)

### Phase 2 Enhancements
1. **Saved Filters** - Store filter preferences per user
2. **Filter Presets** - "Trusted by experts", "Budget picks", etc.
3. **Alerts** - Email notification when new products match saved filters
4. **Export** - CSV/JSON export of filtered results
5. **Comparison** - Side-by-side product comparison

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Slow queries | Low | High | Index verdicts table, add query logging |
| Missing auth_score_avg data | Medium | Medium | Default to 0, add validation in tests |
| Mobile UX issues | Low | Medium | Test on 5+ devices, use Playwright E2E |
| URL param encoding issues | Low | Low | Use URLSearchParams, test special chars |

---

## Success Criteria

✓ All 26 tests passing (backend + frontend + integration)
✓ <100ms query latency (measured in Sentry)
✓ Mobile filter modal accessible (WCAG AA)
✓ Filter URLs shareable and bookmarkable
✓ Zero "fake review" terminology in codebase
✓ Admin dashboard shows filter usage stats

---

## Questions & Clarifications

1. **Should single-product search (/api/v1/search POST) respect filters?**
   - **Answer:** No. Single-product search returns the full verdict card. Filters apply only to product listing/browse (GET /api/v1/products/filter).

2. **Should filters be persistent across sessions?**
   - **Answer:** URL params are persistent (bookmarkable). User preferences can save filters in Phase 2.

3. **Should we add a "category" filter in the filter panel?**
   - **Answer:** Yes, if category param exists. Metadata endpoint returns available categories.

4. **What about filter presets (e.g., "Best for Gaming")?**
   - **Answer:** Phase 2 feature. For now, support all combinations.

---

## Sign-off

**Design reviewed by:** (Awaiting)
**Backend lead:** (Awaiting)
**Frontend lead:** (Awaiting)
**QA:** (Awaiting)

---

*Last Updated: 2026-06-06*
*Next Review: Post-implementation (Day 4 EOD)*
