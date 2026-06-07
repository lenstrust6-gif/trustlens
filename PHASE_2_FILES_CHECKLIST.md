# Phase 2 Files Checklist

Use this document to track which files need to be created/modified.

---

## BACKEND FILES

### New Files to Create (9 total)

#### Workers
- [ ] `/backend/workers/email_sender.py` — Background email processor
  - [ ] Function: `process_pending_emails()`
  - [ ] Function: `send_notification_on_verdict_completion()`
  - [ ] Error handling for Resend API
  - [ ] Logging for debugging

#### Routes
- [ ] `/backend/routes/auth.py` — OAuth callback endpoint
  - [ ] POST `/api/v1/users/oauth-callback` (200 new user, 200 existing)
  
- [ ] `/backend/routes/notifications.py` — Notification preferences
  - [ ] POST `/api/v1/notifications/preferences`
  - [ ] GET `/api/v1/notifications/history`

#### Database
- [ ] `/backend/db/repositories/saved_products.py` — Saved products CRUD
  - [ ] Function: `create()`
  - [ ] Function: `delete()`
  - [ ] Function: `get_by_user()` (paginated)
  - [ ] Function: `exists()`

#### Tests (5 files, 44+ tests)
- [ ] `/backend/tests/test_email_sender.py` (8 tests)
  - [ ] `test_process_pending_emails_happy_path()`
  - [ ] `test_process_pending_emails_api_failure()`
  - [ ] `test_process_pending_emails_missing_data()`
  - [ ] `test_process_pending_emails_batch()`
  - [ ] `test_send_notification_on_verdict()`
  - [ ] `test_email_duplicate_prevention()`
  - [ ] `test_email_status_persistence()`
  - [ ] `test_email_error_logging()`

- [ ] `/backend/tests/test_auth_flow.py` (6 tests)
  - [ ] `test_oauth_callback_new_user()`
  - [ ] `test_oauth_callback_existing_user()`
  - [ ] `test_oauth_callback_missing_email()`
  - [ ] `test_user_preferences_created_automatically()`
  - [ ] `test_user_sync_with_duplicate_email()`
  - [ ] `test_oauth_callback_invalid_token()`

- [ ] `/backend/tests/test_saved_products.py` (6 tests)
  - [ ] `test_save_product_idempotent()`
  - [ ] `test_unsave_product()`
  - [ ] `test_list_saved_products_pagination()`
  - [ ] `test_invalid_product_id()`
  - [ ] `test_unauthorized_access()`
  - [ ] `test_cascade_delete_on_product_removal()`

- [ ] `/backend/tests/test_profile_endpoints.py` (8 tests)
  - [ ] `test_get_user_profile()`
  - [ ] `test_get_user_unauthorized()`
  - [ ] `test_get_preferences()`
  - [ ] `test_update_preferences()`
  - [ ] `test_delete_user_cascade()`
  - [ ] `test_user_not_found()`
  - [ ] `test_unauthorized_access_other_profile()`
  - [ ] `test_preferences_default_values()`

- [ ] `/backend/tests/test_phase2_integration.py` (16 tests)
  - [ ] `test_submit_product_email_captured()`
  - [ ] `test_verdict_created_email_queued()`
  - [ ] `test_email_sent_end_to_end()`
  - [ ] `test_user_login_creates_account()`
  - [ ] `test_user_saves_product()`
  - [ ] `test_user_sees_saved_in_profile()`
  - [ ] `test_notification_preference_affects_email_sending()`
  - [ ] `test_saved_products_cascade_on_user_delete()`
  - [ ] `test_concurrent_email_sends()`
  - [ ] `test_email_with_special_characters_in_product_name()`
  - [ ] `test_oauth_with_missing_avatar_url()`
  - [ ] `test_duplicate_product_submission()`
  - [ ] `test_email_rate_limiting()`
  - [ ] `test_profile_page_performance()`
  - [ ] `test_saved_products_with_deleted_product()`
  - [ ] `test_session_timeout_redirects_to_signin()`

### Files to Modify (7 total)

#### Core Models
- [ ] `/backend/db/models.py`
  - [ ] Add `SavedProductModel` class with UNIQUE constraint

#### Pipeline
- [ ] `/backend/pipeline/orchestrator.py`
  - [ ] Import `email_sender`
  - [ ] After verdict creation, call `send_notification_on_verdict_completion()`
  - [ ] Handle exceptions from email_sender

#### Routes
- [ ] `/backend/routes/users.py` (expand significantly)
  - [ ] GET `/api/v1/users/{user_id}` — Profile endpoint
  - [ ] GET `/api/v1/users/{user_id}/preferences`
  - [ ] PUT `/api/v1/users/{user_id}/preferences`
  - [ ] DELETE `/api/v1/users/{user_id}`
  - [ ] POST `/api/v1/users/{user_id}/saved-products`
  - [ ] DELETE `/api/v1/users/{user_id}/saved-products/{product_id}`
  - [ ] GET `/api/v1/users/{user_id}/saved-products`

#### Services
- [ ] `/backend/services/email_service.py`
  - [ ] Add unsubscribe link support
  - [ ] Add localization headers (EN/HI)

#### Main App
- [ ] `/backend/main.py`
  - [ ] Import new routes: `auth`, `notifications`
  - [ ] Register routers: `include_router(auth.router)`, `include_router(notifications.router)`

#### Database Connection
- [ ] `/backend/db/connection.py` (if auth middleware needed)
  - [ ] Add JWT validation middleware
  - [ ] Extract user_id from token
  - [ ] Set request.state.user_id

---

## FRONTEND FILES

### New Files to Create (7 total)

#### Pages
- [ ] `/frontend/src/app/[locale]/profile/page.tsx` — User profile page
  - [ ] SSR component with getServerSession()
  - [ ] Redirect if not authenticated
  - [ ] Fetch user, preferences, saved products
  - [ ] Render ProfileSection, NotificationPreferences, SavedProductsList

- [ ] `/frontend/src/app/[locale]/profile/layout.tsx` (optional)
  - [ ] Shared profile layout if needed

#### Components
- [ ] `/frontend/src/components/ProfileSection.tsx`
  - [ ] Display avatar, name, email, joined date
  - [ ] Logout button
  - [ ] Fetch from `GET /api/v1/users/{user_id}`

- [ ] `/frontend/src/components/NotificationPreferences.tsx`
  - [ ] Toggle checkbox for `email_notifications`
  - [ ] Call `PUT /api/v1/users/{user_id}/preferences`
  - [ ] Show updated state

- [ ] `/frontend/src/components/SavedProductsList.tsx`
  - [ ] Paginated list of saved products
  - [ ] Show product name, trust score, saved date
  - [ ] "Remove" button per product
  - [ ] Call `DELETE /api/v1/users/{user_id}/saved-products/{product_id}`

- [ ] `/frontend/src/components/SaveButton.tsx`
  - [ ] Heart icon (❤️/🤍)
  - [ ] Only show if logged in
  - [ ] POST to save, DELETE to unsave
  - [ ] Optimistic UI updates
  - [ ] Toast notifications

- [ ] `/frontend/src/components/UserMenu.tsx`
  - [ ] Dropdown menu with Profile, Preferences, Sign Out
  - [ ] Avatar + user name
  - [ ] Click outside closes menu

### Files to Modify (3 total)

#### Auth
- [ ] `/frontend/src/app/api/auth/[...nextauth]/route.ts`
  - [ ] Update `signIn` callback to call `/api/v1/users/oauth-callback`
  - [ ] Update `jwt` callback to store user.id + provider
  - [ ] Update `session` callback to add user.id to session
  - [ ] Add error handling for backend sync failure

#### Components
- [ ] `/frontend/src/components/VerdictCard/index.tsx`
  - [ ] Import SaveButton
  - [ ] Add SaveButton near product title
  - [ ] Pass productId and productName as props

- [ ] `/frontend/src/components/home/NavBar.tsx`
  - [ ] Add conditional render: LoginButton (if !session) or UserMenu (if session)
  - [ ] Implement UserMenu dropdown
  - [ ] Add profile link
  - [ ] Add sign out functionality

---

## DATABASE

### Migration (1 file)

- [ ] Run SQL migration
  ```sql
  CREATE TABLE saved_products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id)
  );
  CREATE INDEX idx_saved_products_user_id ON saved_products(user_id);
  ```

### Verification
- [ ] Table exists in local DB: `\dt saved_products`
- [ ] Index exists: `\di idx_saved_products_user_id`
- [ ] Foreign keys valid: `\d saved_products`

---

## CONFIGURATION

### Environment Variables (verify existing)

**Backend `.env`:**
- [ ] `RESEND_API_KEY` — Email API key
- [ ] `ANTHROPIC_API_KEY` — Claude API (existing)
- [ ] `GROQ_API_KEY` — Gemma API (existing)

**Frontend `.env.local`:**
- [ ] `NEXT_PUBLIC_API_URL` — Backend URL
- [ ] `GOOGLE_CLIENT_ID` — OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` — OAuth client secret
- [ ] `NEXTAUTH_SECRET` — JWT secret (32+ chars, random)
- [ ] `NEXTAUTH_URL` — Frontend URL (for callbacks)

### Verification
- [ ] `.env` files don't commit to git (in `.gitignore`)
- [ ] All secrets are unique per environment (dev, staging, prod)

---

## TESTING CHECKLIST

### Unit Tests (Backend)
- [ ] All email_sender tests passing
- [ ] All auth_flow tests passing
- [ ] All saved_products tests passing
- [ ] All profile_endpoints tests passing

### Integration Tests (Backend)
- [ ] Submit → Email captured
- [ ] Verdict created → Email queued
- [ ] Email sent → Status updated to 'sent'
- [ ] OAuth callback → User created in DB
- [ ] User preferences → Cached in Redis

### Frontend Tests
- [ ] Profile page loads (authenticated)
- [ ] Redirects to signin (unauthenticated)
- [ ] Save button works (optimistic UI)
- [ ] Notification toggle works
- [ ] Logout clears session

### E2E Tests (Full Stack)
- [ ] Submit product → Receive email
- [ ] Login → View profile → Save product → See in profile
- [ ] Logout → Redirects home
- [ ] No console errors
- [ ] Mobile responsive

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment (Staging)
- [ ] Run full test suite: `pytest backend/tests/ -v` (93+ tests passing)
- [ ] Check backend: `curl http://localhost:8000/api/v1/health`
- [ ] Check frontend: `curl http://localhost:3000`
- [ ] Verify database migration applied to staging DB
- [ ] Test OAuth flow with staging Google app
- [ ] Verify Resend API key working (send test email)

### Deployment (Production)
- [ ] Database migration: `CREATE TABLE saved_products (...)`
- [ ] Backend: `git push origin main` → Railway auto-deploys
- [ ] Frontend: `git push origin main` → Vercel auto-deploys
- [ ] Verify: `curl https://api.trustlens.in/api/v1/health`
- [ ] Verify: `https://trustlens.in/in/profile` loads
- [ ] Smoke test: Login → Save → Profile → Logout

### Post-Deployment (Monitoring)
- [ ] Check Sentry: 0 errors (or <5 expected warnings)
- [ ] Check Resend: Email delivery rate >95%
- [ ] Check Railway logs: No 500 errors
- [ ] Check Vercel: Page load time <3s
- [ ] Check Redis: Cache hit rate >85%

---

## FILE SUMMARY

**Total Files:**
- Create: 16 (9 backend + 7 frontend)
- Modify: 10 (7 backend + 3 frontend)
- **Total touched: 26 files**

**Total Lines of Code (estimate):**
- Backend: 2,500 lines (workers, routes, tests)
- Frontend: 1,500 lines (components, pages)
- **Total: ~4,000 lines**

**Total Tests:**
- New tests: 44+ (backend)
- Existing tests: 49 (should all still pass)
- **Total: 93+ tests**

---

## Status Tracking

Print this checklist and check off as you complete each file:

```
Day 1-2: Email Sender
[ ] email_sender.py created
[ ] test_email_sender.py created
[ ] orchestrator.py modified
[ ] 8 tests passing

Day 2-3: OAuth Callback
[ ] auth.py created
[ ] [...nextauth]/route.ts modified
[ ] test_auth_flow.py created
[ ] 6 tests passing

Day 3-4: User Endpoints
[ ] users.py expanded with endpoints
[ ] test_profile_endpoints.py created
[ ] 8 tests passing

Day 4-5: Saved Products
[ ] saved_products.py created
[ ] SavedProductModel added to models.py
[ ] users.py endpoints for saved products
[ ] test_saved_products.py created
[ ] 6 tests passing

Day 5-6: Integration Tests
[ ] test_phase2_integration.py created
[ ] 16 integration tests passing
[ ] All 93+ tests passing

Day 5-6: Profile Page
[ ] profile/page.tsx created
[ ] ProfileSection.tsx created
[ ] NotificationPreferences.tsx created
[ ] SavedProductsList.tsx created

Day 6-7: Save Button
[ ] SaveButton.tsx created
[ ] VerdictCard modified with SaveButton
[ ] E2E save flow working

Day 6-7: NavBar Updates
[ ] UserMenu.tsx created
[ ] NavBar.tsx modified
[ ] Login/logout flow working

Day 8: E2E Testing & Fixes
[ ] Submit → Email flow verified
[ ] Auth → Save → Profile flow verified
[ ] All edge cases tested
[ ] No console errors

Day 9: Deployment
[ ] Database migration applied (staging)
[ ] Backend deployed
[ ] Frontend deployed
[ ] Smoke tests passing
[ ] Sentry monitoring active
```

---

**Last Updated:** 2026-06-06  
**Use this alongside PHASE_2_QUICKSTART.md for daily progress tracking**
