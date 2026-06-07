# Advanced Filters Implementation Checklist

**Estimated Duration:** 3-4 days  
**Team Size:** 1-2 developers (1 backend, 1 frontend)  
**Complexity:** Medium  
**Risk Level:** Low (no database migrations, building on existing FilterService)

---

## Pre-Implementation Setup (30 minutes)

- [ ] Create feature branch: `git checkout -b feature/advanced-filters`
- [ ] Add database indexes to verdicts table (optional but recommended for performance)
  ```sql
  CREATE INDEX idx_verdicts_auth_score ON verdicts(auth_score_avg);
  CREATE INDEX idx_verdicts_tier ON verdicts(confidence_tier);
  CREATE INDEX idx_verdicts_sources ON verdicts(source_count_yt, source_count_amz);
  ```
- [ ] Review ADVANCED_FILTERS_DESIGN.md in full
- [ ] Ensure all dependencies are installed:
  - Backend: `FastAPI`, `SQLAlchemy`, `Pydantic` (already have)
  - Frontend: `React 18`, `next/navigation` (already have)

---

## Day 1: Backend Enhancement

### 1.1 Extend FilterService (backend/services/filter_service.py)

- [ ] Add `get_auth_score_range()` static method
  - Query min/max of `auth_score_avg` from verdicts table
  - Handle null values (default 0-100)
  - Test with empty database
  
- [ ] Add `get_confidence_tiers()` static method
  - Query distinct `confidence_tier` values
  - Order alphabetically
  - Handle null values
  
- [ ] Add `get_categories()` static method
  - Query distinct `category` from products table
  - Filter by locale
  - Order alphabetically
  
- [ ] Update `filter_products()` signature
  - Add parameter: `auth_score_min: Optional[int] = None`
  - Add parameter: `auth_score_max: Optional[int] = None`
  - Add parameter: `confidence_tiers: Optional[list[str]] = None`
  - Add parameter: `source: str = "both"`
  
- [ ] Implement new filter logic in `filter_products()`
  - Add WHERE clause: `auth_score_avg >= auth_score_min`
  - Add WHERE clause: `auth_score_avg <= auth_score_max`
  - Add WHERE clause: `confidence_tier IN (...)`
  - Add WHERE clause: `source_count_yt > 0` (if source='youtube')
  - Add WHERE clause: `source_count_amz > 0` (if source='amazon')
  - Keep existing filters (trust_score, category, brands) unchanged

**Tests for 1.1:**
- [ ] test_get_auth_score_range
- [ ] test_get_confidence_tiers
- [ ] test_get_categories
- [ ] test_filter_by_auth_score_range
- [ ] test_filter_by_confidence_tier
- [ ] test_filter_by_source_youtube_only
- [ ] test_filter_by_source_amazon_only
- [ ] test_all_filters_combined

### 1.2 Extend Filter Routes (backend/routes/filters.py)

- [ ] Add GET `/api/v1/products/auth-score-range` endpoint
  - Query parameters: `locale`, `category` (optional)
  - Response: `{"min": 0, "max": 100}`
  - Error handling: 500 on DB error
  
- [ ] Add GET `/api/v1/products/confidence-tiers` endpoint
  - Query parameters: `locale`, `category` (optional)
  - Response: `{"tiers": ["early", "growing", "established", "mature"]}`
  
- [ ] Add GET `/api/v1/products/categories` endpoint
  - Query parameters: `locale`
  - Response: `{"categories": [...]}`
  
- [ ] Update existing `/api/v1/products/filter` endpoint documentation
  - Document new parameters
  - Update response schema

**Tests for 1.2:**
- [ ] test_auth_score_range_endpoint
- [ ] test_confidence_tiers_endpoint
- [ ] test_categories_endpoint
- [ ] test_filter_endpoint_with_new_params

### 1.3 Update Search Route (backend/routes/search.py)

- [ ] Update `SearchRequest` Pydantic model
  - Add optional fields: `trust_score_min`, `trust_score_max`
  - Add optional fields: `auth_score_min`, `auth_score_max`
  - Add optional field: `confidence_tiers: Optional[list[str]] = None`
  - Add optional field: `source: str = "both"`
  
- [ ] Update `/api/v1/search` endpoint documentation
  - Note: Filters apply to product listing, not single-product search
  - Clarify behavior (returns full verdict card, filters ignored for single product)

**Tests for 1.3:**
- [ ] test_search_request_with_new_fields
- [ ] test_search_endpoint_backwards_compatible

### 1.4 Write Backend Tests

- [ ] Create `backend/tests/test_advanced_filters.py` with 12+ test cases
  - Each test: ~10-15 LOC
  - Use existing fixtures from conftest.py
  - Test happy path, edge cases, error handling

**Expected test count: 15 backend tests total**
**Expected backend code: ~250 LOC (FilterService + routes + tests)**

**Acceptance Criteria for Day 1:**
- [ ] All 15 backend tests passing
- [ ] `pytest backend/tests/test_filters.py -v` shows 30+ passing tests
- [ ] No new errors in Sentry (test on staging if possible)
- [ ] No "fake review" terminology in new code

---

## Day 2: Frontend Components

### 2.1 Create useFilters Hook (frontend/src/lib/hooks/useFilters.ts)

- [ ] Implement hook structure
  - Use `useSearchParams()` to read current filters
  - Use `useRouter()` to update URL on filter change
  - Return object with:
    - `trustMin`, `trustMax` (numbers)
    - `authMin`, `authMax` (numbers)
    - `source` (string: 'youtube' | 'amazon' | 'both')
    - `tiers` (string[] of tier names)
    - `category` (string or null)
    
- [ ] Implement setter functions
  - `setTrustRange(min, max)` → updates URL params
  - `setAuthRange(min, max)` → updates URL params
  - `setSource(source)` → updates URL params
  - `setTiers(tiers)` → updates URL params, comma-separated
  - `setCategory(category)` → updates URL params
  
- [ ] Implement utility functions
  - `clearAll()` → resets URL to base (keeps `q` if present)
  - `activeCount()` → returns number of non-default filters
  - `hasFilter(type)` → boolean check for specific filter

**Tests for 2.1:**
- [ ] test_hook_reads_url_params
- [ ] test_hook_updates_url_on_change
- [ ] test_hook_clears_all_filters
- [ ] test_hook_preserves_search_query

### 2.2 Create TrustScoreFilter Component

- [ ] Create `frontend/src/components/AdvancedFilters/TrustScoreFilter.tsx`
  - Import `useFilters` hook
  - Use two `<input type="range">` for min/max
  - Debounce updates (500ms)
  - Display current range as text (e.g., "7.0 - 10.0")
  - Min: 0, Max: 10, Step: 0.5
  
- [ ] Styling
  - Match existing dark theme
  - Show labels and range display
  - Responsive on mobile

**Tests for 2.2:**
- [ ] test_renders_with_default_range
- [ ] test_updates_on_slider_change
- [ ] test_debounce_delay

### 2.3 Create AuthScoreFilter Component

- [ ] Create `frontend/src/components/AdvancedFilters/AuthScoreFilter.tsx`
  - Similar to TrustScoreFilter
  - Min: 0, Max: 100, Step: 5
  - Label: "Authenticity Score"
  - Display range with "%" suffix

### 2.4 Create SourceFilter Component

- [ ] Create `frontend/src/components/AdvancedFilters/SourceFilter.tsx`
  - Use three `<input type="radio">` elements
  - Options: "Both (YouTube + Amazon)", "YouTube Only", "Amazon Only"
  - Default: "both"
  - Update URL on change (no debounce needed)

### 2.5 Create ConfidenceTierFilter Component

- [ ] Create `frontend/src/components/AdvancedFilters/ConfidenceTierFilter.tsx`
  - Use four `<input type="checkbox">` elements
  - Options: ["early", "growing", "established", "mature"]
  - Store selected tiers as string[] in state
  - Update URL on change (comma-separated)
  - Label: "Confidence Tier"

### 2.6 Create FilterChips Component

- [ ] Create `frontend/src/components/AdvancedFilters/FilterChips.tsx`
  - Display active filters as small "chips"
  - Each chip shows: `Trust Score ≥ 7.5` with ✕ button
  - Show "Clear All" button if any filters active
  - Hide if no filters active
  - Click ✕ removes individual filter
  - Click "Clear All" resets all

### 2.7 Create Main AdvancedFilters Component

- [ ] Create `frontend/src/components/AdvancedFilters/index.tsx`
  - Wrap all sub-components
  - Mobile: Toggle button + slide-up modal
  - Desktop: Sticky sidebar (280px wide)
  - Show filter count badge (e.g., "Filters (3)")
  - Import and display `FilterChips` above filter panel

**Expected frontend code: ~800 LOC across 6 components + hook**

**Acceptance Criteria for Day 2:**
- [ ] All 6 filter components render without errors
- [ ] useFilters hook syncs with URL params correctly
- [ ] Mobile layout: filter modal opens/closes
- [ ] Desktop layout: sidebar sticky
- [ ] All filter chips appear when filters active
- [ ] Dark theme applied (var(--bg), var(--text-primary), etc.)

---

## Day 3: Integration & Testing

### 3.1 Update API Client (frontend/src/lib/api.ts)

- [ ] Add `fetchFiltersMetadata(locale: string)` method
  - Fetch: `/api/v1/products/auth-score-range`
  - Fetch: `/api/v1/products/confidence-tiers`
  - Fetch: `/api/v1/products/categories`
  - Return combined object with all metadata
  - Handle errors gracefully
  
- [ ] Add `searchWithFilters(params)` method
  - Accept params object with all filter options
  - Build query string from params
  - Call GET `/api/v1/products/filter`
  - Handle pagination (limit, offset)
  - Return products array + total count

### 3.2 Integrate into SearchContent

- [ ] Update `frontend/src/app/[locale]/search/search-content.tsx`
  - Import `AdvancedFilters` component
  - Import `useFilters` hook
  - Add `AdvancedFilters` component to JSX (above or beside search input)
  - Pass `locale` prop
  
- [ ] Update search logic to use filters
  - Read filter params from URL
  - Pass filters to API call
  - Display results based on filters
  - Show result count

### 3.3 Write Frontend Tests

- [ ] Create `frontend/__tests__/components/AdvancedFilters.test.tsx`
  - Test each component renders
  - Test filter state changes update URL
  - Test active filter count
  - Test clear all functionality
  
- [ ] Create `frontend/__tests__/hooks/useFilters.test.ts`
  - Test hook initialization
  - Test param reading
  - Test param writing

**Expected test count: 12 frontend unit tests**

### 3.4 Write Integration Tests

- [ ] Create `frontend/e2e/advanced-filters.spec.ts` (Playwright)
  - Test: Navigate to search page
  - Test: Open filter panel
  - Test: Adjust trust score slider → URL updates → results filter
  - Test: Select source preference → results update
  - Test: Select confidence tiers → results update
  - Test: Clear all filters → URL resets
  - Test: Filters work on mobile
  
- [ ] Run tests locally: `npx playwright test`

**Expected integration test count: 6 E2E scenarios**

### 3.5 Load Testing (Optional)

- [ ] Simulate 100 concurrent searches with filters
  - Measure query latency (target: <100ms)
  - Monitor database connection pool
  - Check for N+1 queries

**Acceptance Criteria for Day 3:**
- [ ] 12 frontend unit tests passing
- [ ] 6 E2E tests passing (desktop + mobile)
- [ ] No console errors or warnings
- [ ] Filter state persists across page reloads (URL-based)
- [ ] Results update within 500ms of filter change (debounce)

---

## Day 4: Polish, Documentation & QA

### 4.1 Styling & UX Polish

- [ ] Desktop filter sidebar
  - [ ] Sticky positioning works on scroll
  - [ ] All text readable (contrast ratio ≥ 4.5:1)
  - [ ] Sliders accessible with keyboard
  - [ ] Focus states visible
  
- [ ] Mobile filter modal
  - [ ] Slide-up animation smooth
  - [ ] Touch-friendly button sizes (≥44x44px)
  - [ ] Keyboard: Escape closes modal
  - [ ] Background overlay prevents scroll
  
- [ ] Filter chips
  - [ ] Chip color matches filter type
  - [ ] Remove (✕) button easy to click
  - [ ] "Clear All" button prominent

### 4.2 Accessibility (WCAG AA)

- [ ] All sliders have `aria-label`
- [ ] Radio buttons/checkboxes properly labeled
- [ ] Color not sole way to convey info (add icons/text)
- [ ] Mobile: test with screen reader (VoiceOver)
- [ ] Run axe accessibility scanner

### 4.3 Error Handling

- [ ] Show error message if filter metadata fails to load
  - Fallback: use hardcoded defaults (0-100 for auth, ["early", "growing", "established", "mature"] for tiers)
  
- [ ] Show error message if search fails
  - Existing error handling in SearchContent should catch it
  
- [ ] Invalid filter params in URL
  - Gracefully handle out-of-range values
  - Clamp to valid ranges

### 4.4 Documentation

- [ ] Create `/docs/ADVANCED_FILTERS.md`
  - Overview of feature
  - URL parameter documentation
  - API endpoint documentation
  - Component architecture diagram
  
- [ ] Create `/ADVANCED_FILTERS_MIGRATION.md`
  - No breaking changes note
  - New endpoints listed
  - New URL parameters documented
  
- [ ] Update `/CLAUDE.md`
  - Add "Week 9" section with completed tasks
  - Note any architectural decisions
  - List files created/modified

### 4.5 Code Quality

- [ ] Run linter on all new files
  - Backend: `ruff check backend/`
  - Frontend: `eslint frontend/src/components/AdvancedFilters/`
  
- [ ] Run type checker on all new files
  - Backend: `mypy backend/services/filter_service.py`
  - Frontend: `tsc --noEmit` (TypeScript compiler)
  
- [ ] Code review
  - Self-review all changes
  - Check for "fake review" terminology
  - Verify no API keys in code

### 4.6 Performance Verification

- [ ] Browser DevTools: Network tab
  - Filter metadata request <200ms
  - Search results request <500ms
  
- [ ] Chrome Lighthouse
  - Run on search page
  - Verify no major performance regressions
  - Check Core Web Vitals
  
- [ ] Database query timing
  - Log slow queries (>100ms)
  - Review query plan with EXPLAIN

### 4.7 Final Testing

- [ ] Smoke test: All 5 filter types work
- [ ] Regression test: Existing search still works
- [ ] Cross-browser: Chrome, Firefox, Safari, Edge
- [ ] Cross-device: Desktop, tablet, mobile
- [ ] Cross-locale: Test on `/in/search`, `/us/search`, `/uk/search`

**Acceptance Criteria for Day 4:**
- [ ] All linting passes (0 errors, 0 warnings)
- [ ] All type checks pass
- [ ] Accessibility: WCAG AA compliant
- [ ] Performance: <100ms query latency, <500ms end-to-end
- [ ] Documentation: Comprehensive and up-to-date
- [ ] No "fake review" terminology anywhere

---

## Final Verification Checklist

### Backend
- [ ] 15+ tests passing: `pytest backend/tests/test_advanced_filters.py -v`
- [ ] All routes working: curl test on staging
- [ ] No linting errors: `ruff check backend/`
- [ ] No type errors: `mypy backend/`
- [ ] Database indexes created (optional)
- [ ] No breaking changes to existing API

### Frontend
- [ ] 12+ unit tests passing: `npm test -- AdvancedFilters`
- [ ] 6+ E2E tests passing: `npx playwright test advanced-filters`
- [ ] All components render
- [ ] Dark theme applied
- [ ] Mobile responsive
- [ ] No console errors
- [ ] No linting errors: `eslint frontend/src/components/AdvancedFilters/`
- [ ] No type errors: `tsc --noEmit`

### Integration
- [ ] API client methods work
- [ ] SearchContent integrates AdvancedFilters
- [ ] URL params persist across reloads
- [ ] Filter state syncs with URL
- [ ] Results update on filter change
- [ ] "Clear All" works
- [ ] Mobile modal works

### Documentation
- [ ] ADVANCED_FILTERS.md created
- [ ] ADVANCED_FILTERS_MIGRATION.md created
- [ ] CLAUDE.md updated with Week 9 section
- [ ] Code comments added for complex logic
- [ ] Architecture diagram complete

### QA & Deployment
- [ ] No "fake review" terminology in code/docs
- [ ] Performance baseline established (<100ms queries)
- [ ] Accessibility tested (WCAG AA)
- [ ] Cross-browser/device testing done
- [ ] Staging deployment successful
- [ ] Ready for production rollout

---

## Rollout Plan

### Pre-Release (Day 5)
- [ ] Deploy to staging environment
- [ ] Run full E2E test suite on staging
- [ ] Internal testing by team (15 minutes)
- [ ] Monitor Sentry for errors (30 minutes)

### Beta Release (Day 6)
- [ ] Deploy to production with 5% traffic
- [ ] Monitor error rate (target: <0.1%)
- [ ] Monitor performance (target: <100ms)
- [ ] Gather user feedback (watch for complaints)

### Full Release (Day 7+)
- [ ] Roll out to 100% of traffic
- [ ] Monitor admin dashboard for filter usage stats
- [ ] Plan Phase 2 features (saved filters, presets)

---

## Rollback Plan

If critical issues found after deployment:

1. **Immediate:** Roll back via feature flag (if present)
2. **Short-term:** Revert commit + deploy previous version
3. **Post-mortem:** Root cause analysis + fix before retry

No database rollback needed (no migrations).

---

## File Summary

### Files to CREATE (11 total)

**Backend (4 files):**
1. `/backend/tests/test_advanced_filters.py` (150 LOC)

**Frontend (6 files):**
2. `/frontend/src/components/AdvancedFilters/index.tsx` (120 LOC)
3. `/frontend/src/components/AdvancedFilters/TrustScoreFilter.tsx` (80 LOC)
4. `/frontend/src/components/AdvancedFilters/AuthScoreFilter.tsx` (80 LOC)
5. `/frontend/src/components/AdvancedFilters/SourceFilter.tsx` (60 LOC)
6. `/frontend/src/components/AdvancedFilters/ConfidenceTierFilter.tsx` (70 LOC)
7. `/frontend/src/components/AdvancedFilters/FilterChips.tsx` (70 LOC)
8. `/frontend/src/lib/hooks/useFilters.ts` (100 LOC)
9. `/frontend/__tests__/components/AdvancedFilters.test.tsx` (150 LOC)

**Documentation (2 files):**
10. `/docs/ADVANCED_FILTERS.md`
11. `/ADVANCED_FILTERS_MIGRATION.md`

### Files to MODIFY (5 total)

**Backend (3 files):**
1. `/backend/services/filter_service.py` (add 4 methods, ~80 LOC)
2. `/backend/routes/filters.py` (add 3 endpoints, ~80 LOC)
3. `/backend/routes/search.py` (update SearchRequest, ~20 LOC)

**Frontend (2 files):**
4. `/frontend/src/app/[locale]/search/search-content.tsx` (add 10 LOC)
5. `/frontend/src/lib/api.ts` (add 2 methods, ~50 LOC)

**Documentation (1 file):**
6. `/CLAUDE.md` (add Week 9 section)

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Tests Passing | 100% | `pytest` + `npm test` |
| Code Coverage | ≥85% for new code | Coverage reports |
| Query Latency | <100ms | Database logs + Sentry |
| Error Rate | <0.1% | Sentry dashboard |
| Page Load Time | <2s | Lighthouse, DevTools |
| Accessibility | WCAG AA | axe scanner, manual test |
| Mobile UX | Responsive | Device testing |

---

## Questions Before Starting?

1. Should we use Tailwind CSS or inline styles for new components?
   - **Answer:** Match existing style (uses inline `style={{}}` objects)

2. Should we add filter presets (e.g., "Budget picks", "Expert verified")?
   - **Answer:** No, Phase 2 feature

3. Should we track filter usage analytics?
   - **Answer:** Optional via existing Plausible setup, Phase 2

4. Do we need to support filter history (browser back/forward)?
   - **Answer:** Yes, automatic via URL params

---

**Prepared by:** Claude Code  
**Date:** 2026-06-06  
**Status:** Ready for Implementation
