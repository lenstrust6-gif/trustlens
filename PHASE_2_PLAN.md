# TrustLens Phase 2 Implementation Plan
## Email Notifications + User Authentication
**Status:** Draft  
**Target Timeline:** 2 weeks  
**Priority:** Critical Path Features  

---

## Executive Summary

Phase 2 adds two core features to unlock user engagement:
1. **Email Notifications** — Notify users when verdicts are ready for products they submitted
2. **User Authentication** — Google OAuth login, user profiles, saved favorites, personalization

**Current State:**
- ✅ Database schema complete (users, user_preferences, saved_searches, email_captures, emails all defined)
- ✅ NextAuth.js v5 scaffolded with Google Provider
- ✅ Backend email service (Resend API integration ready)
- ✅ Submit endpoint captures emails for notify-me
- ⚠️ Authentication callbacks NOT persisting to database
- ⚠️ No background worker to send queued emails
- ⚠️ No profile page or "Save to Favorites" feature

**Architectural Constraints:**
- OAuth only (no password auth per business rules)
- FastAPI backend + NextAuth.js frontend (token-based auth)
- Redis cache for 72h TTL (shared by both subsystems)
- PostgreSQL async (SQLAlchemy ORM)

---

## Detailed Requirements

### 1. EMAIL NOTIFICATIONS SYSTEM

#### 1.1 Database Schema (✅ Already Defined)
Tables ready in `/backend/db/models.py`:
- `email_captures` — Product submission requests (email_captures.py repo ready)
- `emails` — Queued notifications with status tracking (emails.py repo ready)

**Missing:** Background worker to process pending emails

#### 1.2 Backend Implementation

**New Files to Create:**
1. `/backend/workers/email_sender.py` — Background job to send queued emails
2. `/backend/routes/notifications.py` — API endpoints for notification preferences

**Functions Needed in `email_sender.py`:**
```python
async def process_pending_emails(session: AsyncSession) -> dict
    # Fetch pending emails from DB
    # Send via Resend API
    # Update status to "sent", "failed", or "bounced"
    # Return stats: {processed: int, sent: int, failed: int}

async def send_notification_on_verdict_completion(
    session: AsyncSession,
    product_id: UUID,
    verdict_summary: str,
    trust_score: float,
) -> int
    # Find all email_captures for this product
    # Create Email records for each
    # Return count sent
```

**Endpoint in `notifications.py`:**
```python
POST /api/v1/notifications/preferences
    # Update email_notifications flag in user_preferences
    # Requires auth session

GET /api/v1/notifications/history
    # Fetch email history for authenticated user
    # Paginated, filtered by status
    # Requires auth session
```

#### 1.3 Background Worker Integration

**Where:** `/backend/workers/refresh_scheduler.py` already runs on a schedule.  
**Pattern:** Add email processing trigger when verdicts are created.

**Trigger Point:**
- When `Orchestrator.run_pipeline()` completes successfully in `/backend/pipeline/orchestrator.py`
- Call `await email_sender.send_notification_on_verdict_completion(...)`

#### 1.4 Email Template Refinements

**Current:** `EmailService.send_verdict_notification()` in `/backend/services/email_service.py` has a solid HTML template.

**New:** Add templates for:
- Unsubscribe link (GDPR compliance)
- Multi-language support (English + Hindi headers)
- Affiliate links in footer

---

### 2. USER AUTHENTICATION SYSTEM

#### 2.1 Database Schema (✅ Already Defined)
Tables in `/backend/db/models.py`:
- `users` — Google OAuth users (UserModel)
- `user_preferences` — Notification + locale settings (UserPreferencesModel)
- `saved_searches` — Bookmarked searches (SavedSearchModel)

**New Table Needed:**
```sql
CREATE TABLE saved_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);
```

#### 2.2 NextAuth Configuration (⚠️ Needs Backend Sync)

**Current File:** `/frontend/src/app/api/auth/[...nextauth]/route.ts`

**Issues:**
- ✅ Google Provider configured
- ✅ JWT strategy selected
- ❌ `callbacks.jwt()` and `callbacks.session()` do NOT sync to backend DB
- ❌ No user creation on first signin

**Changes Needed:**
```typescript
// In route.ts callbacks:

async signIn({ user, account }) {
    // Call backend endpoint to create/update user
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/oauth-callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: user.email,
            name: user.name,
            google_id: account.providerAccountId,  // NEW
            avatar_url: user.image,
        }),
    })
    const dbUser = await res.json()
    user.id = dbUser.id  // Store DB ID in JWT
    return true
}

async jwt({ token, user, account }) {
    if (user) {
        token.id = user.id
        token.provider = account?.provider
    }
    return token
}

async session({ session, token }) {
    if (session.user) {
        session.user.id = token.id as string
        session.user.provider = token.provider as string
    }
    return session
}
```

#### 2.3 Backend OAuth Callback Endpoint

**New File:** `/backend/routes/auth.py`

```python
POST /api/v1/users/oauth-callback
    Body: {
        email: str,
        name: str | null,
        google_id: str,
        avatar_url: str | null,
    }
    
    Returns: {
        id: str,
        email: str,
        name: str | null,
        google_id: str,
        created: bool  # True if new user
    }
    
    Logic:
    1. Try get_user_by_google_id()
    2. If not found:
        - Create new user via users.create_user()
        - Create empty preferences via users.get_or_create_preferences()
    3. If found:
        - Update name/avatar if provided
    4. Return user record + created flag
```

#### 2.4 Frontend Profile Page

**New File:** `/frontend/src/app/[locale]/profile/page.tsx`

**Features:**
- Display user info (name, email, avatar)
- Toggle email notifications
- Show saved products / searches
- Logout button
- Delete account (future)

**Structure:**
```typescript
export default async function ProfilePage({ params }) {
    const session = await getServerSession(authOptions)
    if (!session) redirect('/auth/signin')
    
    const user = await fetch(`/api/v1/users/${session.user.id}`)
    const prefs = await fetch(`/api/v1/users/${session.user.id}/preferences`)
    const savedProducts = await fetch(`/api/v1/users/${session.user.id}/saved-products`)
    
    return (
        <ProfileSection user={user} />
        <NotificationPreferences prefs={prefs} />
        <SavedProductsSection products={savedProducts} />
    )
}
```

**Endpoint Requirements:**
- `GET /api/v1/users/{user_id}` — Current user profile
- `GET /api/v1/users/{user_id}/preferences` — Notification + locale settings
- `PUT /api/v1/users/{user_id}/preferences` — Update preferences
- `GET /api/v1/users/{user_id}/saved-products` — Paginated list
- `DELETE /api/v1/users/{user_id}` — Delete account + all data

#### 2.5 "Save to Favorites" Feature

**Frontend Changes:**

1. **VerdictCard Component** (`/frontend/src/components/VerdictCard/index.tsx`)
   - Add "Save" button (heart icon)
   - Only show if logged in (check session)
   - Show toast on save/unsave

2. **SaveButton Component** (new)
   ```typescript
   export default function SaveButton({ productId }: { productId: string }) {
       const { data: session } = useSession()
       const [isSaved, setIsSaved] = useState(false)
       const [loading, setLoading] = useState(false)
       
       if (!session) return <LoginButton /> // Show login prompt
       
       const handleSave = async () => {
           const res = await fetch(`/api/v1/users/${session.user.id}/saved-products`, {
               method: isSaved ? 'DELETE' : 'POST',
               body: JSON.stringify({ product_id: productId }),
           })
           setIsSaved(!isSaved)
       }
       
       return <button onClick={handleSave}>
           {isSaved ? '❤️ Saved' : '🤍 Save'}
       </button>
   }
   ```

**Backend Endpoints:**

```python
POST /api/v1/users/{user_id}/saved-products
    Body: { product_id: UUID }
    Response: { saved: bool, product_name: str }

DELETE /api/v1/users/{user_id}/saved-products/{product_id}
    Response: { deleted: bool }

GET /api/v1/users/{user_id}/saved-products
    Query: ?page=1&limit=20
    Response: {
        total: int,
        products: [{ product_id, product_name, trust_score, saved_at }],
        page: int
    }
```

---

## Implementation Order (Can Run in Parallel)

### Phase 2.1: Email Notifications (Week 1)
**Can work independently — no auth required**

1. **Day 1-2:** Email Sender Background Worker
   - Implement `/backend/workers/email_sender.py`
   - Write tests in `/backend/tests/test_email_sender.py`
   - Verify Resend API integration

2. **Day 2-3:** Wire Background Job into Pipeline
   - Modify `/backend/pipeline/orchestrator.py` to trigger email on verdict completion
   - Test end-to-end (submit → verdict → email queued)

3. **Day 3-4:** Notification Preferences API
   - Implement `/backend/routes/notifications.py`
   - Add email history endpoint

### Phase 2.2: User Authentication (Week 1-2)
**Depends on email system, can run in parallel with notification refinements**

1. **Day 2-3:** OAuth Callback Endpoint
   - Create `/backend/routes/auth.py`
   - Implement user creation/sync logic
   - Wire NextAuth callbacks to call backend

2. **Day 3-4:** Backend User Endpoints
   - `/api/v1/users/{user_id}` (GET)
   - `/api/v1/users/{user_id}/preferences` (GET/PUT)
   - Add auth middleware to check session token

3. **Day 4-5:** Profile Page Frontend
   - Create `/frontend/src/app/[locale]/profile/page.tsx`
   - Wire up all user endpoints
   - Add logout button to NavBar

4. **Day 5-6:** Save to Favorites
   - Create `SavedProductsModel` and repository
   - Implement `/api/v1/users/{user_id}/saved-products` endpoints
   - Build SaveButton component
   - Integrate into VerdictCard

5. **Day 6-7:** Testing + QA
   - Full test coverage (happy path, edge cases, auth failures)
   - E2E: submit → verdict → email → login → save → profile
   - Security review (XSS, CSRF, rate limiting)

---

## Critical Files to Create/Modify

### Backend

**Create:**
- `/backend/workers/email_sender.py` — Main email processing worker
- `/backend/routes/auth.py` — OAuth callback + user creation
- `/backend/routes/users.py` — User profile + preferences endpoints (already exists but needs work)
- `/backend/db/repositories/saved_products.py` — Saved products CRUD
- `/backend/tests/test_email_sender.py` — Email sender tests
- `/backend/tests/test_auth_flow.py` — OAuth flow tests
- `/backend/tests/test_saved_products.py` — Favorites feature tests

**Modify:**
- `/backend/db/models.py` — Add SavedProductModel (new table)
- `/backend/pipeline/orchestrator.py` — Trigger email on verdict complete
- `/backend/main.py` — Register new routes
- `/backend/services/email_service.py` — Add unsubscribe support
- `/backend/db/repositories/users.py` — Add saved_products methods

### Frontend

**Create:**
- `/frontend/src/app/[locale]/profile/page.tsx` — User profile page
- `/frontend/src/app/[locale]/profile/layout.tsx` — Profile layout (protected)
- `/frontend/src/components/SaveButton.tsx` — Heart/favorite button
- `/frontend/src/components/ProfileSection.tsx` — User info display
- `/frontend/src/components/SavedProductsList.tsx` — Bookmarks page

**Modify:**
- `/frontend/src/app/api/auth/[...nextauth]/route.ts` — Add DB sync in callbacks
- `/frontend/src/components/VerdictCard/index.tsx` — Add SaveButton
- `/frontend/src/components/home/NavBar.tsx` — Add profile link + logout button
- `/frontend/src/components/UserMenu.tsx` — Implement user dropdown

### Database

**New Migration:**
```sql
-- Add saved_products table
CREATE TABLE saved_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Index for faster queries
CREATE INDEX idx_saved_products_user_id ON saved_products(user_id);
```

---

## Database Schema Changes

### New Table: `saved_products`

```python
class SavedProductModel(Base):
    __tablename__ = "saved_products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint('user_id', 'product_id', name='uq_user_product'),
    )
```

---

## Testing Strategy

### Unit Tests (Fast, 100% coverage)

**Email Sender (`test_email_sender.py`):**
- ✅ Test pending email fetch from DB
- ✅ Test Resend API call (mock httpx)
- ✅ Test status update logic (sent, failed, bounced)
- ✅ Test error handling (network timeout, invalid email)
- ✅ Test batch processing (multiple emails in one run)

**OAuth Callback (`test_auth_flow.py`):**
- ✅ Test user creation on first login
- ✅ Test user update on repeat login
- ✅ Test JWT token generation
- ✅ Test missing fields handling

**Saved Products (`test_saved_products.py`):**
- ✅ Test save product (idempotent)
- ✅ Test unsave product
- ✅ Test list saved products (pagination)
- ✅ Test delete on product removal (cascading)

### Integration Tests (Database + Mocks)

- End-to-end: Submit → Verdict Created → Email Queued → Email Sent
- Google OAuth flow (use testutils for Google mock)
- User logs in → Views profile → Saves product → Sees it in favorites
- Email preferences toggle affects email sending

### E2E Tests (Full Stack)

- Browser: Sign in with Google → View profile → Save product → Check email
- Admin: Monitor email queue → See delivery status

---

## Testing Data Requirements

### Seed Data (Development)
```python
# In backend/scripts/seed_products.py or new test_data.py

test_user = {
    id: "google-123456",
    email: "test@example.com",
    name: "Test User",
    google_id: "123456",
}

test_email_capture = {
    email: "user@example.com",
    product_name: "boAt Airdopes 121",
    locale: "in",
}

test_saved_product = {
    user_id: "google-123456",
    product_id: "<seed_product_uuid>",
}
```

---

## API Specification

### Email Notifications Endpoints

#### POST /api/v1/notifications/preferences
```
Request:
{
    "email_notifications": bool
}

Response (200):
{
    "user_id": "google-123456",
    "email_notifications": true,
    "updated_at": "2026-06-06T10:30:00Z"
}

Errors:
- 401 Unauthorized (no session)
- 400 Bad Request (invalid body)
```

#### GET /api/v1/notifications/history
```
Request:
Query params: ?status=sent&limit=20&offset=0

Response (200):
{
    "total": 42,
    "emails": [
        {
            "id": "uuid",
            "subject": "Your TrustLens verdict for boAt Airdopes 121 is ready!",
            "status": "sent",
            "sent_at": "2026-06-06T10:25:00Z",
            "product_name": "boAt Airdopes 121"
        }
    ],
    "page": 1
}

Errors:
- 401 Unauthorized
- 400 Bad Request
```

### User Endpoints

#### POST /api/v1/users/oauth-callback
```
Request:
{
    "email": "user@gmail.com",
    "name": "John Doe",
    "google_id": "123456789",
    "avatar_url": "https://..."
}

Response (201 Created):
{
    "id": "google-123456789",
    "email": "user@gmail.com",
    "name": "John Doe",
    "google_id": "123456789",
    "created": true,  // true if new user
    "avatar_url": "https://..."
}

Errors:
- 400 Bad Request (missing fields)
```

#### GET /api/v1/users/{user_id}
```
Response (200):
{
    "id": "google-123456",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar_url": "https://...",
    "created_at": "2026-06-01T10:00:00Z"
}

Errors:
- 401 Unauthorized
- 404 Not Found
```

#### GET/PUT /api/v1/users/{user_id}/preferences
```
GET Response (200):
{
    "user_id": "google-123456",
    "email_notifications": true,
    "default_locale": "in",
    "default_sort": "trust_score_desc"
}

PUT Request:
{
    "email_notifications": false,
    "default_locale": "us",
    "default_sort": "newest_first"
}

PUT Response (200):
{
    "user_id": "google-123456",
    "email_notifications": false,
    "default_locale": "us",
    "default_sort": "newest_first",
    "updated_at": "2026-06-06T10:30:00Z"
}

Errors:
- 401 Unauthorized
- 400 Bad Request
```

#### POST /api/v1/users/{user_id}/saved-products
```
Request:
{
    "product_id": "uuid"
}

Response (201 Created):
{
    "id": "uuid",
    "user_id": "google-123456",
    "product_id": "uuid",
    "created_at": "2026-06-06T10:25:00Z"
}

Errors:
- 401 Unauthorized
- 404 Not Found (product doesn't exist)
- 409 Conflict (already saved)
```

#### DELETE /api/v1/users/{user_id}/saved-products/{product_id}
```
Response (204 No Content)

Errors:
- 401 Unauthorized
- 404 Not Found
```

#### GET /api/v1/users/{user_id}/saved-products
```
Request:
Query params: ?page=1&limit=20

Response (200):
{
    "total": 5,
    "page": 1,
    "limit": 20,
    "products": [
        {
            "product_id": "uuid",
            "product_name": "boAt Airdopes 121",
            "brand": "boAt",
            "trust_score": 7.8,
            "saved_at": "2026-06-05T10:00:00Z"
        }
    ]
}

Errors:
- 401 Unauthorized
- 400 Bad Request
```

---

## Estimated Scope

| Component | Effort | Files | Tests | Risk |
|-----------|--------|-------|-------|------|
| Email Sender Worker | 3 days | 2 | 8 | Low |
| OAuth Callback + DB Sync | 2 days | 3 | 6 | Medium (Google config) |
| User Profile Page | 2 days | 3 | 4 | Low |
| Saved Products Feature | 3 days | 5 | 6 | Low |
| Integration Tests | 2 days | 4 | 20+ | Medium |
| **Total** | **~12 days** | **17** | **44+** | **Medium** |

**Buffer:** +2 days for debugging, security review, and deployment checklist.

---

## Security Considerations

1. **OAuth Token Security**
   - Never expose GOOGLE_CLIENT_SECRET client-side (✅ backend only)
   - NEXTAUTH_SECRET must be strong (32+ chars) and unique per environment

2. **Session Management**
   - JWT maxAge: 30 days (keep reasonable)
   - Refresh strategy: re-auth on expiry
   - No session revocation yet (Phase 3: add logout token blacklist)

3. **User Data Privacy**
   - Email captures → strictly GDPR compliant (unsubscribe link mandatory)
   - Saved products visible only to owner (row-level security via user_id)
   - Profile deletion should cascade (orphan check: no dangling email_capture_id)

4. **Rate Limiting**
   - Email sending: max 5 emails/second per API key
   - User preferences: max 10 updates/minute per user
   - Saved products: max 100/minute per user

5. **XSS Prevention**
   - Email HTML: sanitize verdict_summary (already done in template)
   - Frontend forms: React auto-escapes, but validate on backend

6. **CSRF Protection**
   - NextAuth handles CSRF tokens automatically ✅
   - Manual API calls: use same-site cookies + CORS validation

---

## Deployment Checklist

**Pre-Deploy:**
- [ ] All 44+ tests passing
- [ ] No console.error() or logger.error() in happy path
- [ ] Security review (no hardcoded secrets)
- [ ] Performance: email_sender batch processes in <5s
- [ ] Sentry integration configured for error tracking

**Deploy Order:**
1. Database migration (add saved_products table)
2. Backend endpoints live
3. NextAuth OAuth callback wired
4. Frontend profile page deployed
5. Email notifications worker activated

**Post-Deploy Monitoring:**
- [ ] Monitor Sentry for auth errors
- [ ] Check Redis cache hit rate (should be >85% for user prefs)
- [ ] Verify email delivery rate (Resend dashboard)
- [ ] Test full flow: submit → verdict → email on production

---

## Technical Debt & Future Work (Phase 3+)

- [ ] Add email list management (unsubscribe -> mark bounced)
- [ ] Implement logout token blacklist (session revocation)
- [ ] Two-factor authentication option
- [ ] Social sharing (save & share verdict with friends)
- [ ] Email template localization (Hindi, Tamil)
- [ ] Webhook for Resend bounce/spam events
- [ ] Advanced filters on saved products (by date, category)

---

## Success Metrics

By end of Phase 2:
- **Email System:** 90%+ delivery rate (Resend API tracking)
- **Auth:** 100+ verified users created
- **Engagement:** 40%+ of authenticated users save ≥1 product
- **NPS:** Email notification satisfaction ≥8/10

---

## References

- NextAuth.js v5 docs: https://next-auth.js.org
- Resend Email API: https://resend.com/docs
- FastAPI dependency injection: https://fastapi.tiangolo.com/tutorial/dependencies
- SQLAlchemy async guide: https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html

---

**Document Owner:** Claude Code  
**Last Updated:** 2026-06-06  
**Version:** 1.0 Final
