# Advanced Filters — Visual Reference Guide

Quick visual guide for understanding the Advanced Filters feature architecture and UI mockups.

---

## Component Hierarchy

```
SearchPage
├── SearchContent (client component)
│   ├── Search Input Box
│   └── AdvancedFilters (NEW - client component)
│       ├── TrustScoreFilter
│       │   └── Dual Range Slider (0-10)
│       ├── AuthScoreFilter
│       │   └── Dual Range Slider (0-100)
│       ├── SourceFilter
│       │   └── Radio Buttons (Both/YouTube/Amazon)
│       ├── ConfidenceTierFilter
│       │   └── Checkboxes (Early/Growing/Established/Mature)
│       └── FilterChips
│           └── Active Filter Display
│
└── Verdict Cards Grid
    └── VerdictCard (existing component)
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERACTION                     │
│  Adjusts slider / Clicks checkbox / Selects radio       │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │  onChange handler   │
        │  in Filter Component│
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────────────┐
        │ useFilters() hook           │
        │ • Parse current URL params  │
        │ • Debounce updates (500ms)  │
        │ • Call router.push()        │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────────────┐
        │  URL Params Update          │
        │  ?trust_min=7.5&auth_min=70 │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────────────────────────┐
        │  SearchContent reads useSearchParams()  │
        │  Triggers new search with filters       │
        └──────────┬──────────────────────────────┘
                   │
        ┌──────────▼──────────────────────────┐
        │  api.searchWithFilters()            │
        │  GET /api/v1/products/filter        │
        │  ?trust_min=7.5&auth_min=70         │
        └──────────┬──────────────────────────┘
                   │
        ┌──────────▼──────────────────────┐
        │  Backend FilterService          │
        │  WHERE clauses applied:         │
        │  • auth_score_avg >= 70         │
        │  • confidence_tier IN (...)     │
        │  • source_count_yt > 0          │
        └──────────┬──────────────────────┘
                   │
        ┌──────────▼──────────────────┐
        │  SQL Execution               │
        │  <100ms latency (with indexes)
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────────────┐
        │  Products[] + Verdicts[]     │
        │  Returned to frontend        │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────────────┐
        │  Frontend renders            │
        │  VerdictCard for each result │
        └──────────▼──────────────────┘
                   │
                ✅ DONE
```

---

## Desktop UI Layout

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                        TRUSTLENS SEARCH                                   ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ [Search products...]                                                      ║
║                                                                           ║
╠═════════════════════════════╦═══════════════════════════════════════════╣
║ 🔍 FILTERS (3 active)       ║ VERDICT CARD 1                            ║
║ ┌─────────────────────────┐ ║ ╔═══════════════════════════════════════╗║
║ │ TRUST SCORE             │ ║ ║ boAt Airdopes 141                    ║║
║ │ [────────●──]           │ ║ ║ 🎧 TWS Earbuds                      ║║
║ │ 7.0 ───────── 10.0      │ ║ ║                                      ║║
║ │                         │ ║ ║ ⭐ Trust Score: 8.3/10 (Established) ║║
║ ├─────────────────────────┤ ║ ║ ✔ Authenticity: 82/100              ║║
║ │ AUTHENTICITY SCORE      │ ║ ║ 📊 Source: YouTube (42) + Amazon (38)║║
║ │ [────────●──]           │ ║ ║                                      ║║
║ │ 70 ──────── 100         │ ║ ║ Summary: The boAt Airdopes 141...    ║║
║ │                         │ ║ ║ [more content]                      ║║
║ ├─────────────────────────┤ ║ ╚═══════════════════════════════════════╝║
║ │ SOURCE PREFERENCE       │ ║                                           ║
║ │ ○ Both                  │ ║ VERDICT CARD 2                            ║
║ │ ◉ YouTube Only          │ ║ ╔═══════════════════════════════════════╗║
║ │ ○ Amazon Only           │ ║ ║ Noise ColorFit Pro 4                  ║║
║ │                         │ ║ ║ ⌚ Smartwatches                       ║║
║ ├─────────────────────────┤ ║ ║                                      ║║
║ │ CONFIDENCE TIER         │ ║ ║ ⭐ Trust Score: 7.9/10 (Established) ║║
║ │ ☐ Early                 │ ║ ║ ✔ Authenticity: 76/100              ║║
║ │ ☑ Growing               │ ║ ║ 📊 Source: YouTube (35) + Amazon (42)║║
║ │ ☑ Established           │ ║ ║                                      ║║
║ │ ☑ Mature                │ ║ ║ Summary: A feature-rich smartwatch... ║║
║ │                         │ ║ ║ [more content]                      ║║
║ │ [Clear All]             │ ║ ╚═══════════════════════════════════════╝║
║ └─────────────────────────┘ ║                                           ║
║                             ║ [pagination or infinite scroll]           ║
║ ┌─────────────────────────┐ ║                                           ║
║ │ Active Filters:         │ ║                                           ║
║ │ [Trust ≥7.0 ✕]          │ ║                                           ║
║ │ [Auth ≥70 ✕]            │ ║                                           ║
║ │ [YouTube ✕]             │ ║                                           ║
║ └─────────────────────────┘ ║                                           ║
╚═════════════════════════════╩═══════════════════════════════════════════╝
```

---

## Mobile UI Layout

### Default View (No Filters Open)

```
┌──────────────────────────────┐
│ TrustLens  [☰ Menu]  [🔍]     │  ← Header with filter button
├──────────────────────────────┤
│ [Search products...]         │
├──────────────────────────────┤
│ [🔍 Filters (3)]             │  ← Filter button with badge
│  Trust ≥7 ✕                  │  ← Active filters inline
│  Auth ≥70 ✕                  │
│  YouTube ✕                   │
│ [Clear All]                  │
├──────────────────────────────┤
│ VERDICT CARD 1               │
│ ╔════════════════════════╗   │
│ ║ boAt Airdopes 141      ║   │
│ ║ 🎧 TWS Earbuds        ║   │
│ ║ ⭐ 8.3 | 🔒 82/100   ║   │
│ ║ ✔ Sources: YT + AMZ   ║   │
│ ║ [View Details]         ║   │
│ ╚════════════════════════╝   │
│                              │
│ VERDICT CARD 2               │
│ ╔════════════════════════╗   │
│ ║ Noise ColorFit Pro 4   ║   │
│ ║ ⌚ Smartwatches        ║   │
│ ║ ⭐ 7.9 | 🔒 76/100   ║   │
│ ║ ✔ Sources: YT + AMZ   ║   │
│ ║ [View Details]         ║   │
│ ╚════════════════════════╝   │
│                              │
│ [Load More]                  │
└──────────────────────────────┘
```

### Mobile Filters Open (Bottom Sheet Modal)

```
┌──────────────────────────────┐
│ TrustLens  [☰ Menu]  [🔍]     │  ← Dimmed background
├──────────────────────────────┤
│ ▓▓▓ VERDICT CARDS (blurred) ▓▓│  ← Backdrop
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│                              │
│ ┌──────────────────────────┐ │
│ │ ⬆ Advanced Filters       │ │  ← Slide-up modal
│ ├──────────────────────────┤ │
│ │ TRUST SCORE              │ │
│ │ [────────●────]          │ │
│ │ 7.0 ────────── 10.0      │ │
│ │                          │ │
│ ├──────────────────────────┤ │
│ │ AUTHENTICITY SCORE       │ │
│ │ [────────●────]          │ │
│ │ 70 ────────────── 100    │ │
│ │                          │ │
│ ├──────────────────────────┤ │
│ │ SOURCE PREFERENCE        │ │
│ │ ○ Both                   │ │
│ │ ◉ YouTube Only           │ │
│ │ ○ Amazon Only            │ │
│ │                          │ │
│ ├──────────────────────────┤ │
│ │ CONFIDENCE TIER          │ │
│ │ ☐ Early                  │ │
│ │ ☑ Growing                │ │
│ │ ☑ Established            │ │
│ │ ☑ Mature                 │ │
│ │                          │ │
│ │ [Clear All]              │ │
│ │ [↓ Close & Apply]        │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

---

## URL Parameter Examples

### Example 1: Budget Earbuds with High Authenticity
```
/in/search?q=earbuds&trust_min=7.5&auth_min=70&source=both
```
Results: Earbuds with Trust ≥ 7.5, Auth ≥ 70, from both YouTube and Amazon

### Example 2: YouTube-Only Reviews, Established Tier
```
/in/search?q=smartwatch&source=youtube&tiers=established,mature
```
Results: Smartwatches reviewed on YouTube, Established or Mature tier only

### Example 3: Premium Earbuds, High Authenticity
```
/in/search?q=earbuds&trust_min=8.5&auth_min=85&source=youtube
```
Results: Top-rated earbuds with high-authenticity YouTube reviews

### Example 4: Share with Friend
```
Copy URL: /in/search?trust_min=7&auth_min=70&category=tws-earbuds
Send to friend: They see same filters applied
```

---

## SQL Query Pattern

**With filters applied:**

```sql
SELECT 
  products.id,
  products.name,
  products.slug,
  products.category,
  products.brand,
  verdicts.trust_score,
  verdicts.auth_score_avg,
  verdicts.confidence_tier,
  verdicts.source_count_yt,
  verdicts.source_count_amz
FROM products
JOIN verdicts ON products.id = verdicts.product_id
WHERE 
  products.locale = 'in'                        -- Always required
  AND products.category = 'tws-earbuds'         -- IF category filter
  AND verdicts.trust_score >= 7.5               -- IF trust_min
  AND verdicts.trust_score <= 10.0              -- IF trust_max
  AND verdicts.auth_score_avg >= 70             -- IF auth_min (NEW)
  AND verdicts.auth_score_avg <= 100            -- IF auth_max (NEW)
  AND verdicts.confidence_tier IN (...)         -- IF confidence_tiers (NEW)
  AND verdicts.source_count_yt > 0              -- IF source='youtube' (NEW)
ORDER BY verdicts.trust_score DESC              -- Default sort
LIMIT 50 OFFSET 0;
```

**Execution time:**
- ❌ Without indexes: ~150ms (table scan)
- ✅ With indexes: ~30ms (index seeks)

**Recommended indexes:**
```sql
CREATE INDEX idx_verdicts_auth_score ON verdicts(auth_score_avg);
CREATE INDEX idx_verdicts_tier ON verdicts(confidence_tier);
CREATE INDEX idx_verdicts_sources ON verdicts(source_count_yt, source_count_amz);
```

---

## Filter Chip Display Logic

```
┌─────────────────────────────────────────┐
│ Active Filters:                         │
├─────────────────────────────────────────┤
│ [Trust ≥ 7.5 ✕]  [Auth ≥ 70 ✕]       │
│ [YouTube Only ✕]  [2 Tiers ✕]         │
│                                        │
│ [Clear All]                            │
└─────────────────────────────────────────┘
```

**Logic:**
```typescript
const chips = [
  trustMin !== 0 && { label: `Trust ≥ ${trustMin}`, type: 'trust' },
  authMax !== 100 && { label: `Auth ≤ ${authMax}`, type: 'auth' },
  source !== 'both' && { label: `${source.capitalize()} Only`, type: 'source' },
  tiers.length > 0 && { label: `${tiers.length} Tier(s)`, type: 'tier' },
  category && { label: category, type: 'category' },
].filter(Boolean)
```

---

## State Management Flow

```
┌─────────────────────────────────┐
│  URL Params (Source of Truth)   │
│  ?trust_min=7.5&auth_min=70     │
└────────┬────────────────────────┘
         │
    useSearchParams()
         │
    ┌────▼────────────────────┐
    │  useFilters() Hook      │
    │  • Parse params         │
    │  • Return filter values │
    │  • Return setters       │
    └────┬──────────┬─────────┘
         │          │
    ┌────▼──┐   ┌───▼─────────────┐
    │Display│   │Update Handler   │
    │Value  │   │Calls setTrustMin│
    │       │   │→ debounce(500ms)│
    └───────┘   │→ router.push()  │
                │→ URL updates    │
                │→ Re-render      │
                └─────────────────┘
```

**No Redux, Context, or complex state — just URL params!**

---

## Component Props & Event Flow

### TrustScoreFilter Component

```typescript
// Props
{
  locale: string  // passed from parent
}

// Internal state
{
  localMin: number     // debounce buffer
  localMax: number
}

// Events
onChange: (min, max) => {
  setLocalMin/setLocalMax()  // update local state
  debouncedUpdate()           // call useFilters setter
  → setTrustRange(min, max)   // calls router.push()
  → URL updates
}
```

### AuthScoreFilter Component (similar)

```typescript
// Props: { locale }
// Internal state: { localMin, localMax }
// Events: onChange → setAuthRange() → URL updates
```

### SourceFilter Component

```typescript
// Props: { locale }
// Internal state: { selectedSource }
// Events: onChange → setSource() → URL updates (no debounce)
```

### ConfidenceTierFilter Component

```typescript
// Props: { locale }
// Internal state: { selectedTiers }
// Events: onChange → toggle tier → setTiers() → URL updates
```

---

## Error Handling

```
User adjusts filter
        ↓
API call fails (network error, 500, etc.)
        ↓
Fallback to default values:
  • auth_score_range: 0-100
  • confidence_tiers: all 4
  • categories: empty
        ↓
Show toast/banner: "Filter metadata unavailable, showing all results"
        ↓
User can still search (graceful degradation)
```

---

## Performance Characteristics

### Frontend

| Operation | Target | Notes |
|-----------|--------|-------|
| Filter metadata load | <200ms | Parallel API calls |
| Slider drag | Instant | Local state update, no API call |
| Debounce delay | 500ms | User adjusts, then waits 500ms |
| Results update | <1s total | Debounce + API + render |
| Page load (cached) | <500ms | With Redis cache hits |

### Backend

| Operation | Target | Notes |
|-----------|--------|-------|
| /auth-score-range | <10ms | Simple MIN/MAX query |
| /confidence-tiers | <10ms | DISTINCT query |
| /filter (complex) | <100ms | Multiple WHERE clauses |
| Cache hit | <5ms | Redis lookup |

---

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 90+ | ✅ Full | Modern range sliders |
| Firefox 88+ | ✅ Full | Modern range sliders |
| Safari 14+ | ✅ Full | Modern range sliders |
| Edge 90+ | ✅ Full | Modern range sliders |
| Mobile (iOS 14+) | ✅ Full | Touch-optimized |
| Mobile (Android 10+) | ✅ Full | Touch-optimized |

**Polyfills:** None needed (using native HTML5 `<input type="range">`)

---

## Accessibility Features

```
┌──────────────────────────────────┐
│ ACCESSIBILITY CHECKLIST          │
├──────────────────────────────────┤
│ ☑ All sliders have aria-label    │
│ ☑ Radio buttons properly labeled │
│ ☑ Checkboxes properly labeled    │
│ ☑ Keyboard navigation (Tab)      │
│ ☑ Focus states visible           │
│ ☑ Color contrast ≥ 4.5:1         │
│ ☑ Mobile: Screen reader tested   │
│ ☑ No images without alt text     │
│ ☑ Escape key closes modal        │
│ ☑ WCAG AA compliant              │
└──────────────────────────────────┘
```

---

## Testing Scenarios

### Unit Tests (Backend)
```
✅ filter_products with trust_min=7.5
✅ filter_products with auth_min=70
✅ filter_products with confidence_tiers=['established']
✅ filter_products with source='youtube'
✅ all filters combined
```

### Component Tests (Frontend)
```
✅ TrustScoreFilter renders
✅ AuthScoreFilter updates URL on change
✅ SourceFilter radio selection works
✅ ConfidenceTierFilter checkboxes toggle
✅ FilterChips display active filters
✅ Clear All button works
```

### E2E Tests (Playwright)
```
✅ Search page loads with filter panel
✅ Adjust slider → URL updates → results filter
✅ Select source → results only show that source
✅ Clear all filters → URL resets
✅ Mobile: filter modal opens/closes
✅ Filter URL is shareable
```

---

## Key Metrics to Monitor

After launch, track these in admin dashboard:

```
┌─────────────────────────────────┐
│ USAGE METRICS                   │
├─────────────────────────────────┤
│ Total searches: _________       │
│ Searches with filters: _____    │
│ Filter adoption %: _____%       │
│ Most used filter: ______        │
│ Avg filter count: ______        │
│ Average results: _______        │
│                                 │
│ PERFORMANCE METRICS             │
├─────────────────────────────────┤
│ Query latency: ______ms         │
│ Filter panel load: ____ms       │
│ Error rate: _____%              │
│ Cache hit rate: _____%          │
└─────────────────────────────────┘
```

---

## Quick Reference Cheat Sheet

| Task | Command/Code | Notes |
|------|--------------|-------|
| Start implementation | `git checkout -b feature/advanced-filters` | Create feature branch |
| Check existing tests | `pytest backend/tests/test_filters.py -v` | Should show 25+ passing |
| Add new backend test | Add to `test_advanced_filters.py` | Use existing fixtures |
| Create new component | `touch frontend/src/components/AdvancedFilters/[Name].tsx` | ~80 LOC per component |
| Test component | `npm test -- AdvancedFilters` | Frontend test suite |
| Run E2E tests | `npx playwright test` | Full user flow tests |
| Check for "fake review" | `grep -r "fake review" .` | Must be 0 matches |
| Deploy to staging | `vercel deploy --prod` (frontend) + `railway up` (backend) | Use staging env |

---

**Last Updated:** 2026-06-06  
**Version:** 1.0  
**Status:** Ready for Implementation
