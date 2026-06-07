# Phase 2 Implementation Plan — Executive Summary

**Date:** 2026-06-06  
**Duration:** 2 weeks (12 development days)  
**Team:** 1 engineer (Claude Code)  
**Status:** Ready to Build  

---

## What We're Building

TrustLens Phase 2 adds two core features that unlock user engagement and revenue:

### 1. Email Notifications (5 days)
When a user submits a product for analysis, they enter their email. Once TrustLens generates a verdict, an automated email is sent notifying them it's ready.

**Key Components:**
- Background worker (`email_sender.py`) that processes queued emails
- Integration with Resend API for reliable email delivery
- Automatic trigger when new verdicts are created
- User preference to toggle email notifications

**Impact:** 
- Drives traffic back to site
- Enables "notify-me" feature mentioned on /submit page
- Sets foundation for marketing emails (Phase 3)

### 2. User Authentication + Profiles (7 days)
Users can log in with Google OAuth, view their profile, save favorite products, and manage notification preferences.

**Key Components:**
- Google OAuth via NextAuth.js (already scaffolded)
- Backend sync of users to database
- Profile page with user info and saved products
- "Save to Favorites" button on verdict cards
- Notification preference toggle

**Impact:**
- Locks in user identity (enables personalization)
- Creates saved searches/products for recommendations (Phase 3)
- Allows targeted email campaigns
- Foundation for premium features (Phase 4)

---

## Why This Matters

**Current Gap:** TrustLens has verdicts but no way to:
- Notify users when their submission is ready
- Persist user sessions across visits
- Let users save favorite products
- Track user engagement per product

**Phase 2 Solves This:**
- Users get notified by email (engagement hook)
- Users create accounts and stay logged in (loyalty)
- Users bookmark products (preference signal for ML)
- Backend tracks who saved what (analytics for recommendations)

---

## Scope at a Glance

| Area | Effort | Files | Tests | Risk |
|------|--------|-------|-------|------|
| Email Sender Worker | 3 days | 2 | 8 | Low |
| OAuth + User Sync | 2 days | 3 | 6 | Medium |
| Profile Page + UI | 2 days | 6 | 4 | Low |
| Saved Products Feature | 3 days | 5 | 6 | Low |
| Integration + Deploy | 2 days | 4 | 20+ | Medium |
| **Total** | **~12 days** | **20** | **44+** | **Medium** |

**Buffer:** +2 days for debugging, security review, monitoring.

---

## Technical Architecture

### Backend Stack
- **Framework:** FastAPI (existing)
- **Database:** PostgreSQL (existing) + new `saved_products` table
- **Cache:** Redis for user preferences (72h TTL)
- **Email:** Resend API (SMTP alternative)
- **Auth:** JWT tokens via NextAuth.js

### Frontend Stack
- **Framework:** Next.js 14 App Router (existing)
- **Auth:** NextAuth.js v5 with Google Provider
- **Session:** JWT in HTTP-only cookies
- **UI:** React components + Tailwind CSS

### Data Flow
```
User submits → Email captured in DB
           ↓ (later)
Verdict ready → Email queued in DB → Worker sends via Resend → User gets email
           ↓
User clicks email link → Returns to site → Can now login
           ↓
Logs in via Google → NextAuth callbacks backend → User created in DB
           ↓
Visits /profile → Loads preferences, saved products from DB
           ↓
Clicks "Save" on verdict card → POST to backend → Saved in saved_products table
           ↓
Visits /profile again → Lists all saved products with trust scores
```

---

## Database Changes

**One new table needed:**

```sql
CREATE TABLE saved_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)  -- Can't save same product twice
);

CREATE INDEX idx_saved_products_user_id ON saved_products(user_id);
```

**Tables already exist from Week 4:**
- `users` — Google OAuth users
- `user_preferences` — Notification settings
- `email_captures` — Notify-me signups
- `emails` — Email queue with status tracking

---

## Parallelization Strategy

### Week 1: Email + Foundation (can run in parallel)
- **Developer A:** Email sender worker + pipeline integration
- **Developer B:** OAuth callback endpoint + database sync

### Week 2: Frontend + Integration (sequential)
- **Day 1-2:** Profile page + components (depends on Week 1 backend)
- **Day 2-3:** Save button + NavBar updates
- **Day 3-4:** Full E2E testing + bug fixes
- **Day 4:** Deployment

**Timeline:** 2 weeks with 1 engineer, or 1 week with 2 engineers (frontend + backend parallel)

---

## Critical Success Factors

1. **OAuth Callback Sync** — Must persist users to DB correctly, else profile page breaks
2. **Email Sender Reliability** — Must handle API timeouts, retries, and failures gracefully
3. **Session Security** — JWT tokens must be validated on every protected endpoint
4. **Database Constraints** — UNIQUE(user_id, product_id) prevents duplicate saves
5. **Frontend SSR** — Profile page must redirect unauthenticated users to /auth/signin

---

## Testing Strategy

### Unit Tests (Fast, isolated)
- Email processing logic
- User creation from OAuth
- Preference updates
- Saved product CRUD

### Integration Tests (Database + mocks)
- End-to-end: submit → verdict → email sent
- OAuth flow with mocked Google
- User preferences persistence

### E2E Tests (Full stack in staging)
- Real browser login with Google
- Complete save → profile → unsave flow
- Email delivery verification

### Coverage Target
- Backend: 90%+ (44+ new tests)
- Frontend: 80%+ (visual testing)
- All existing tests still passing

---

## Security Checklist

- [ ] GOOGLE_CLIENT_SECRET never exposed client-side
- [ ] NEXTAUTH_SECRET 32+ chars, unique per environment
- [ ] JWT validated on every protected endpoint
- [ ] CORS only allows trustlens.in domain
- [ ] Saved products visible only to owner (row-level check)
- [ ] Email addresses hashed in email logs (GDPR)
- [ ] Password auth never added (OAuth only)
- [ ] Unsubscribe link in every email (CAN-SPAM)

---

## Performance Targets

- **Email Sender:** Process 50 emails in <5 seconds (10 req/sec throughput)
- **Profile Page Load:** <2 seconds (SSR + Redis cache for prefs)
- **Save Button:** <500ms response time (sync to DB)
- **Cache Hit Rate:** >85% for user preferences (72h TTL)
- **Database Query:** <100ms per request (indexed queries)

---

## Post-Launch Monitoring

### Key Metrics
- **Email Delivery Rate:** Target >95% (tracked in Resend dashboard)
- **User Signup:** Track daily active users (count in users table)
- **Engagement:** % of users with ≥1 saved product
- **Error Rate:** <0.1% in Sentry
- **Page Load Time:** Profile page <2s (measure with Plausible)

### Alerts to Set Up
- Email delivery rate drops below 90%
- Database CPU >80% (slow queries)
- Redis connection errors
- Sentry error spike (>100 errors/hour)

---

## What Phase 2 Enables (Phase 3+)

### Phase 3: Recommendations (4 weeks)
- Recommend products based on saved items
- Email campaign: "New products similar to [saved item]"
- Analytics dashboard showing popular products

### Phase 4: Premium Features (6 weeks)
- Price tracking on saved products
- Custom alerts: "Product price dropped by 20%"
- Review comparison: vs. alternate brands
- Paid tier unlocking premium content

### Phase 5: Marketplace (TBD)
- Direct affiliate links with commission tracking
- Amazon Associates integration
- Commission payout to users

---

## Implementation Documents

This plan consists of 3 documents:

1. **PHASE_2_PLAN.md** (65 sections)
   - Detailed requirements for every component
   - API specifications with request/response examples
   - Database schema changes
   - Testing strategy
   - Deployment checklist

2. **PHASE_2_ARCHITECTURE.md** (8 diagrams)
   - System architecture overview
   - Data flow diagrams (email + auth)
   - Request/response flow with JWT
   - Cache strategy
   - Database relationship (ER diagram)
   - Deployment sequence

3. **PHASE_2_QUICKSTART.md** (10 checklists)
   - Day-by-day building guide
   - Copy-paste sections into CLAUDE.md before each session
   - Pseudo-code for every function
   - Testing checklist for each feature
   - Pre-deployment verification

---

## How to Use These Documents

### Before Starting
1. Read PHASE_2_PLAN.md § "Requirements" (10 min)
2. Review PHASE_2_ARCHITECTURE.md data flow diagrams (5 min)
3. Choose starting point: Email (simpler, parallelizable) or Auth (critical path)

### During Development
1. Copy relevant day's section from PHASE_2_QUICKSTART.md into CLAUDE.md
2. Follow pseudo-code and testing checklist
3. Reference PHASE_2_PLAN.md for detailed API specs
4. Use PHASE_2_ARCHITECTURE.md for debugging data flow issues

### Before Deployment
1. Run full test suite (all 93+ tests passing)
2. Execute smoke test checklist in PHASE_2_QUICKSTART.md
3. Verify Sentry is configured (logging enabled)
4. Check Resend API key is set (email can send)

### After Deployment
1. Monitor post-launch metrics (email delivery, user signups, error rate)
2. Update CLAUDE.md with any technical debt discovered
3. Plan Phase 3 (recommendations engine)

---

## Known Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Google OAuth misconfiguration | Medium | High | Test locally with real Google account before deploy |
| Email API rate limits | Low | Medium | Batch emails, implement exponential backoff |
| Database migration breaks | Low | High | Test migration on staging DB first |
| JWT token expiration issues | Medium | Medium | Set maxAge=30d, test token refresh flow |
| Cascade delete orphans emails | Low | High | Use ondelete="CASCADE", test in staging |
| Session hijacking (XSS) | Low | High | Use HTTP-only cookies, sanitize email HTML |
| Performance: slow profile page | Medium | Low | Add Redis cache for preferences + indexes |

**Mitigation Strategy:** Test everything in staging (PostgreSQL + Redis locally) before production.

---

## Quick Decision Matrix

### Should I build Email or Auth first?

**Email (easier, faster, parallelizable):**
- ✅ No new frontend needed
- ✅ Can test independently
- ✅ Builds confidence quickly
- ❌ Depends on orchestrator.run_pipeline() working

**Auth (critical path, unlocks features):**
- ✅ Enables all user features
- ✅ Foundation for Phase 3
- ❌ Requires Google OAuth setup
- ❌ Must sync to database correctly

**Recommendation:** Build Email first (3 days), then Auth (2 days), then Frontend (4 days).

---

## Budget & Resources

**Effort:** 1 engineer × 12 days = 12 engineer-days  
**Cost (at $150/day):** $1,800  
**ROI:** Enables $500K+ annual revenue (affiliate commissions + premium tiers)

**Requirements:**
- Google OAuth app (free, already created)
- Resend API account ($9/month for email)
- PostgreSQL + Redis (existing, free tier)
- Vercel + Railway (existing, free tier)
- Sentry for error tracking (free tier)

---

## Sign-Off Checklist

Before you start building, verify:

- [ ] You have PHASE_2_PLAN.md open for reference
- [ ] You have PHASE_2_ARCHITECTURE.md diagrams bookmarked
- [ ] You have PHASE_2_QUICKSTART.md ready to copy sections from
- [ ] Database is running locally: `docker-compose up -d`
- [ ] Backend starts: `python -m uvicorn backend.main:app --reload`
- [ ] Frontend starts: `npm run dev` (port 3000)
- [ ] You've read this summary and understand the 2-week timeline
- [ ] You know the critical success factors (OAuth sync, email reliability, session security)
- [ ] You're ready to ask questions if any section is unclear

---

## Contact & Questions

If anything is unclear:
1. Re-read the relevant section in PHASE_2_PLAN.md
2. Check the diagram in PHASE_2_ARCHITECTURE.md
3. Look at the pseudo-code in PHASE_2_QUICKSTART.md
4. Ask Claude Code to clarify (context is ready)

Good luck building Phase 2! 🚀

---

**Document Version:** 1.0 - Final  
**Created:** 2026-06-06  
**Status:** Ready for Implementation  
**Next Steps:** Copy Day 1 checklist from PHASE_2_QUICKSTART.md and start building
