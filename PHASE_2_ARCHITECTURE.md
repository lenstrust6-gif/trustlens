# Phase 2 Architecture Diagram & Data Flow

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          TRUSTLENS PHASE 2                              │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (Next.js)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [Homepage] ──────────────────> [Search Page] ──> [Product Page]      │
│      │                               │                   │              │
│      │                               │ "Sign in with Google"            │
│      │                               │ (NextAuth signIn)               │
│      │                               ▼                   │              │
│  [/submit] ─────────────────> [/auth/signin] ──────────────┐          │
│   (Email)                      (NextAuth UI)               │          │
│                                                             ▼          │
│                                                      [/[locale]/profile]│
│                                                      (User Dashboard)   │
│                                                         - Info          │
│                                                         - Preferences   │
│                                                         - Saved Prods  │
│                                                         - Logout        │
│                                                                         │
│  [VerdictCard] ─────────────────────────────────────────────────────┐ │
│   - ❤️ Save Button (requires auth) ──> SaveButton Component ──────┤ │
│   - Shows trust score, pros/cons                                   │ │
│   - Affiliate link                                                 │ │
│                                                                    │ │
│  [NavBar]                                                          │ │
│   - Login Button (if not authed)                                  │ │
│   - Profile Link + User Menu (if authed) ◄──────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    NEXTAUTH.JS SESSION LAYER                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Google OAuth Provider                                                │
│  ├─ Client ID: GOOGLE_CLIENT_ID (env)                               │
│  ├─ Client Secret: GOOGLE_CLIENT_SECRET (env)                        │
│  └─ Callback URL: /api/auth/callback/google                         │
│                                                                      │
│  JWT Strategy                                                        │
│  ├─ Secret: NEXTAUTH_SECRET (32+ chars)                            │
│  ├─ MaxAge: 30 days                                                │
│  └─ Stored: Secure HTTP-only cookies                              │
│                                                                      │
│  Session Callbacks (→ BACKEND SYNC)                                 │
│  ├─ signIn() ─────> POST /api/v1/users/oauth-callback             │
│  │                  (Create/update user in DB)                      │
│  ├─ jwt() ────────> Store user.id + provider in token             │
│  └─ session() ────> Attach user to session object                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      BACKEND API (FastAPI)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  AUTHENTICATION ROUTES                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ POST /api/v1/users/oauth-callback                          │   │
│  │ ├─ Input: {email, name, google_id, avatar_url}            │   │
│  │ ├─ Logic:                                                  │   │
│  │ │  1. Check if user exists (by google_id)                 │   │
│  │ │  2. If new: Create UserModel + UserPreferencesModel     │   │
│  │ │  3. If exists: Update name/avatar                       │   │
│  │ │  4. Return user.id (for JWT)                            │   │
│  │ └─ Output: {id, email, name, created: bool}               │   │
│  │                                                             │   │
│  │ GET /api/v1/users/{user_id}                               │   │
│  │ ├─ Auth: Requires valid JWT                               │   │
│  │ └─ Returns: User profile (email, name, avatar, created_at)│   │
│  │                                                             │   │
│  │ GET/PUT /api/v1/users/{user_id}/preferences               │   │
│  │ ├─ Auth: Requires valid JWT                               │   │
│  │ └─ GET: Returns {email_notifications, locale, sort}       │   │
│  │ └─ PUT: Updates and returns updated prefs                 │   │
│  │                                                             │   │
│  │ DELETE /api/v1/users/{user_id}                            │   │
│  │ ├─ Auth: Requires valid JWT                               │   │
│  │ └─ Cascade delete: user + prefs + saved_products          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  SAVED PRODUCTS ROUTES                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ POST /api/v1/users/{user_id}/saved-products               │   │
│  │ ├─ Input: {product_id}                                     │   │
│  │ ├─ Returns: {id, user_id, product_id, created_at}         │   │
│  │ └─ Idempotent: 409 Conflict if already saved               │   │
│  │                                                             │   │
│  │ GET /api/v1/users/{user_id}/saved-products                │   │
│  │ ├─ Query: ?page=1&limit=20                                │   │
│  │ └─ Returns: {total, products: [{product_id, name, score}],│   │
│  │            page, limit}                                    │   │
│  │                                                             │   │
│  │ DELETE /api/v1/users/{user_id}/saved-products/{product_id}│   │
│  │ └─ Returns: 204 No Content                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  EMAIL NOTIFICATION ROUTES                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ POST /api/v1/notifications/preferences                     │   │
│  │ ├─ Input: {email_notifications: bool}                      │   │
│  │ └─ Updates UserPreferencesModel.email_notifications        │   │
│  │                                                             │   │
│  │ GET /api/v1/notifications/history                          │   │
│  │ ├─ Query: ?status=sent&limit=20&offset=0                 │   │
│  │ └─ Returns: {total, emails: [{subject, status, sent_at}]}│   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKGROUND WORKERS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  /backend/workers/email_sender.py                                     │
│  ├─ Runs every 1 minute (cron trigger)                               │
│  ├─ Process pending emails:                                          │
│  │  1. Query: SELECT * FROM emails WHERE status='pending' LIMIT 50  │
│  │  2. For each email:                                              │
│  │     - Call Resend API (POST /emails)                            │
│  │     - If 200: UPDATE status='sent', resend_id=...              │
│  │     - If error: UPDATE status='failed', error_message=...       │
│  │  3. Return stats: {processed: 50, sent: 48, failed: 2}         │
│  └─ Triggered on success of: orchestrator.run_pipeline()           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  EXISTING TABLES (Phase 1):                                           │
│  ├─ products (id, name, slug, category, brand, locale, created_at) │
│  ├─ verdicts (id, product_id, trust_score, summary, pros, cons...) │
│  ├─ email_captures (id, email, product_name, notified, created_at) │
│  └─ emails (id, recipient, subject, body, status, resend_id,...)  │
│                                                                      │
│  NEW TABLES (Phase 2):                                              │
│  ├─ users                                                           │
│  │  ├─ id (VARCHAR, PK) ─── Google ID or UUID                     │
│  │  ├─ email (VARCHAR, UNIQUE)                                   │
│  │  ├─ name (VARCHAR)                                            │
│  │  ├─ google_id (VARCHAR, UNIQUE) ─── Google OAuth ID          │
│  │  ├─ avatar_url (VARCHAR)                                      │
│  │  └─ created_at, updated_at (TIMESTAMP)                        │
│  │                                                                │
│  ├─ user_preferences                                             │
│  │  ├─ id (UUID, PK)                                             │
│  │  ├─ user_id (VARCHAR, FK→users) ─── UNIQUE                   │
│  │  ├─ email_notifications (BOOLEAN, default=true)              │
│  │  ├─ default_locale (VARCHAR, default='in')                   │
│  │  ├─ default_sort (VARCHAR, default='trust_score_desc')       │
│  │  └─ created_at, updated_at (TIMESTAMP)                        │
│  │                                                                │
│  ├─ saved_products (NEW in Phase 2)                              │
│  │  ├─ id (UUID, PK)                                             │
│  │  ├─ user_id (VARCHAR, FK→users, CASCADE)                      │
│  │  ├─ product_id (UUID, FK→products, CASCADE)                   │
│  │  ├─ created_at (TIMESTAMP)                                    │
│  │  └─ UNIQUE(user_id, product_id)                               │
│  │                                                                │
│  └─ saved_searches (Phase 2)                                     │
│     ├─ id (UUID, PK)                                              │
│     ├─ user_id (VARCHAR, FK→users, CASCADE)                       │
│     ├─ query (VARCHAR)                                            │
│     ├─ filters (JSON)                                             │
│     ├─ category (VARCHAR)                                         │
│     └─ created_at, last_searched (TIMESTAMP)                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      CACHE (Redis/Upstash)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Key Pattern: user:{user_id}:preferences                              │
│  Value: {email_notifications, locale, sort}                          │
│  TTL: 72 hours                                                        │
│                                                                        │
│  Key Pattern: user:{user_id}:saved-products                          │
│  Value: List of product IDs                                          │
│  TTL: 24 hours                                                        │
│                                                                        │
│  Key Pattern: pending-emails:batch:{batch_id}                        │
│  Value: {processed, sent, failed}                                    │
│  TTL: 1 hour                                                          │
│                                                                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Google OAuth                                                         │
│  └─ Called by: NextAuth.js (frontend)                                │
│     On success: user object passed to signIn callback                │
│                                                                        │
│  Resend Email API                                                    │
│  └─ Called by: email_sender worker (backend)                         │
│     POST https://api.resend.com/emails                               │
│     Headers: Authorization: Bearer {RESEND_API_KEY}                  │
│     Response: {id, created_at, from, to, ...}                       │
│                                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Submit → Verdict → Email → Login → Save

### Flow 1: Email Notification (Unauthenticated)

```
User Journey:
┌─────────────────────────────────────────────────────────────────────┐
│ User visits /submit and fills form:                                 │
│ ├─ Product Name: "boAt Airdopes 121"                               │
│ ├─ Email: "user@example.com"                                       │
│ └─ Locale: "in"                                                    │
└─────────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: POST /api/v1/submit                                       │
│ {                                                                   │
│   "product_name": "boAt Airdopes 121",                            │
│   "email": "user@example.com",                                     │
│   "locale": "in"                                                   │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Backend: routes/submit.py                                           │
│ ├─ repos.emails.create() → EmailCaptureModel                       │
│ │  (email, product_name, locale, notified=false)                   │
│ │                                                                  │
│ └─ repos.misses.upsert() → SearchMissModel                         │
│    (tracks missed searches for analytics)                          │
│                                                                     │
│ DB Result: INSERT INTO email_captures (...) VALUES (...)           │
└─────────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ [LATER] Background: orchestrator.run_pipeline() completes           │
│ ├─ YouTube comments fetched + filtered                             │
│ ├─ Amazon reviews fetched                                          │
│ ├─ AI: Authenticity scores, themes, sentiment                      │
│ ├─ Verdict created: VerdictModel                                   │
│ └─ Trigger: email_sender.send_notification_on_verdict_completion() │
└─────────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ email_sender.py:                                                    │
│ ├─ Find all EmailCaptureModel WHERE product_name = "boAt..."       │
│ ├─ For each capture:                                               │
│ │  ├─ EmailService.send_verdict_notification(                      │
│ │  │    recipient_email="user@example.com",                        │
│ │  │    product_name="boAt Airdopes 121",                         │
│ │  │    verdict_summary="High trust...",                          │
│ │  │    trust_score=8.2,                                          │
│ │  │    verdict_url="https://trustlens.in/in/search/..."         │
│ │  │  )                                                             │
│ │  │                                                                │
│ │  ├─ Call: POST https://api.resend.com/emails                    │
│ │  │  {                                                             │
│ │  │    "from": "verdicts@trustlens.in",                         │
│ │  │    "to": "user@example.com",                                │
│ │  │    "subject": "Your TrustLens verdict for boAt... is ready!",│
│ │  │    "html": "<html>...</html>"                               │
│ │  │  }                                                             │
│ │  │                                                                │
│ │  └─ Response: {id: "xyz123", created_at: "...", ...}          │
│ │                                                                   │
│ │  ├─ repos.emails.update_email_status(                           │
│ │  │    email_id=...,                                             │
│ │  │    status="sent",                                            │
│ │  │    resend_id="xyz123"                                       │
│ │  │  )                                                             │
│ │  │                                                                │
│ │  └─ Mark email_capture as notified=true                         │
│ │                                                                   │
│ └─ Return stats: {processed: 1, sent: 1, failed: 0}               │
└─────────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ User inbox: Email arrives with                                      │
│ ├─ Hero: "🎉 Your Verdict is Ready!"                              │
│ ├─ Product: "boAt Airdopes 121"                                    │
│ ├─ Trust Score: "8.2/10"                                           │
│ ├─ Summary: "High trust score based on YouTube + Amazon reviews"  │
│ └─ CTA: [View Full Verdict →]                                     │
│    (Links to: /in/search?q=boAt+Airdopes+121)                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Flow 2: User Authentication & Saved Products (Authenticated)

```
User Journey:
┌─────────────────────────────────────────────────────────────────────┐
│ User clicks [Sign in with Google] on nav bar                       │
└─────────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: signIn('google')                                          │
│ (NextAuth.js client calls)                                         │
└─────────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Redirects to: /api/auth/signin                                      │
│ User logs in via Google OAuth consent screen                       │
│ Google returns: code + state                                       │
└─────────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ NextAuth callback handler:                                          │
│ ├─ Exchange code for access_token (Google)                         │
│ ├─ Fetch user info (email, name, picture)                         │
│ │                                                                   │
│ └─ Call signIn callback:                                           │
│    ├─ POST /api/v1/users/oauth-callback                           │
│    │  {                                                             │
│    │    "email": "john@gmail.com",                                │
│    │    "name": "John Doe",                                        │
│    │    "google_id": "117834567890",                              │
│    │    "avatar_url": "https://lh3.googleusercontent.com/..."    │
│    │  }                                                             │
│    │                                                                │
│    ├─ Backend (auth.py):                                           │
│    │  ├─ Check: repos.users.get_user_by_google_id("117834...")  │
│    │  ├─ NOT FOUND → Create:                                      │
│    │  │  ├─ repos.users.create_user(...)                         │
│    │  │  │  → INSERT INTO users (id="117834567890", email=...) │
│    │  │  │                                                         │
│    │  │  └─ repos.users.get_or_create_preferences(...)           │
│    │  │     → INSERT INTO user_preferences (...) VALUES (...)    │
│    │  │                                                             │
│    │  └─ Return:                                                   │
│    │     {                                                         │
│    │       "id": "117834567890",                                  │
│    │       "email": "john@gmail.com",                            │
│    │       "name": "John Doe",                                    │
│    │       "google_id": "117834567890",                           │
│    │       "created": true                                        │
│    │     }                                                         │
│    │                                                                │
│    ├─ NextAuth stores in JWT:                                      │
│    │  {                                                             │
│    │    "sub": "117834567890",                                    │
│    │    "id": "117834567890",                                     │
│    │    "email": "john@gmail.com",                               │
│    │    "name": "John Doe",                                       │
│    │    "picture": "https://...",                                │
│    │    "iat": 1716043200,                                        │
│    │    "exp": 1748579200,                                        │
│    │    "jti": "abcdef123456"                                    │
│    │  }                                                             │
│    │                                                                │
│    └─ Set secure HTTP-only cookie: next-auth.session-token      │
│                                                                     │
│ └─ Return true (signIn succeeds)                                   │
└─────────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Redirect: /[locale]/page (homepage, now showing profile button)    │
│ NextAuth session available: session.user.id = "117834567890"       │
└─────────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ User clicks product's "❤️ Save" button                             │
│ (SaveButton component, visible now that session exists)            │
└─────────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: SaveButton.tsx                                            │
│ ├─ const { data: session } = useSession()                         │
│ ├─ POST /api/v1/users/{session.user.id}/saved-products            │
│ │  {                                                                │
│ │    "product_id": "uuid-of-boat-airdopes"                        │
│ │  }                                                                │
│ │                                                                   │
│ └─ Show toast: "✅ Saved to your collection"                      │
└─────────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Backend: routes/users.py (POST endpoint)                            │
│ ├─ Verify user_id from JWT matches request                        │
│ ├─ Query: SELECT * FROM products WHERE id='uuid-of-boat...'       │
│ ├─ Insert: INSERT INTO saved_products (user_id, product_id)      │
│ │  (UNIQUE constraint prevents duplicates)                        │
│ │                                                                   │
│ └─ Response: {id: "...", user_id: "...", product_id: "..."}      │
│              (or 409 Conflict if already saved)                    │
│                                                                     │
│ DB Result:                                                          │
│ saved_products                                                      │
│ ├─ id: uuid-12345                                                  │
│ ├─ user_id: "117834567890"                                         │
│ ├─ product_id: "uuid-of-boat-airdopes"                            │
│ └─ created_at: 2026-06-06 10:25:00                                │
└─────────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ User clicks navbar: Profile → [User Menu dropdown]                 │
│ ├─ [👤 John Doe]                                                   │
│ ├─ [⚙️ Settings] → /[locale]/profile                              │
│ └─ [🚪 Sign Out]                                                   │
└─────────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Profile Page: /[locale]/profile                                    │
│ ├─ Server-side SSR:                                                │
│ │  ├─ const session = await getServerSession(authOptions)        │
│ │  ├─ if (!session) redirect('/auth/signin')                     │
│ │  │                                                               │
│ │  ├─ Fetch user data:                                           │
│ │  │  GET /api/v1/users/{session.user.id}                      │
│ │  │  → {id, email, name, avatar_url, created_at}             │
│ │  │                                                               │
│ │  ├─ Fetch preferences:                                         │
│ │  │  GET /api/v1/users/{session.user.id}/preferences          │
│ │  │  → {email_notifications, locale, default_sort}           │
│ │  │                                                               │
│ │  └─ Fetch saved products:                                      │
│ │     GET /api/v1/users/{session.user.id}/saved-products      │
│ │     → {total: 3, products: [{...}, {...}, {...}]}           │
│ │                                                                │
│ └─ Render:                                                         │
│    ├─ ProfileSection                                              │
│    │  ├─ Avatar                                                   │
│    │  ├─ Name: "John Doe"                                        │
│    │  ├─ Email: "john@gmail.com"                                │
│    │  └─ Joined: "June 1, 2026"                                 │
│    │                                                               │
│    ├─ NotificationPreferences                                     │
│    │  ├─ [✅] Email me when new verdicts are ready             │
│    │  ├─ [✅] Notify me about saved product updates            │
│    │  └─ [Save Changes]                                         │
│    │                                                               │
│    ├─ SavedProductsSection                                        │
│    │  ├─ "You have 3 saved products"                            │
│    │  ├─ List:                                                   │
│    │  │  1. boAt Airdopes 121 (8.2/10) [❤️ Remove]           │
│    │  │  2. Noise ColorFit Ultra (7.9/10) [❤️ Remove]        │
│    │  │  3. Mi Smart Band 7 (8.1/10) [❤️ Remove]             │
│    │  │                                                           │
│    │  └─ [Share Collection]                                     │
│    │                                                               │
│    └─ SignOut Button                                              │
│       └─ [🚪 Sign Out]                                           │
│          (Calls: signOut() from next-auth/react)                 │
│          (Clears JWT cookie, redirects to /)                     │
│                                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Request/Response Flow: JWT Authentication

```
┌──────────────────────────────────────────────────────────────────────┐
│ AUTHENTICATED API CALL (e.g., GET /api/v1/users/{user_id})          │
└──────────────────────────────────────────────────────────────────────┘

Frontend (Next.js):
┌────────────────────────────────────────┐
│ const { data: session } = useSession()  │
│ // session.user.id = "117834567890"    │
│                                        │
│ fetch(`/api/v1/users/${session.user.id}`, {
│   method: 'GET',                       │
│   headers: {                           │
│     'Content-Type': 'application/json',│
│     // Cookie auto-attached by browser:│
│     // Cookie: next-auth.session-token │
│   }                                    │
│ })                                     │
└────────────────────────────────────────┘
            ▼
Backend (FastAPI):
┌────────────────────────────────────────┐
│ @router.get("/api/v1/users/{user_id}") │
│ async def get_user(                    │
│   user_id: str,                        │
│   request: Request,  ◄─ Extract JWT   │
│   session: AsyncSession = Depends(...) │
│ ):                                     │
│   # 1. Verify JWT in Authorization     │
│   #    header (if not in cookie)       │
│   #                                    │
│   # 2. Decode & validate signature     │
│   #    (using NEXTAUTH_SECRET)         │
│   #                                    │
│   # 3. Check expiration (exp claim)    │
│   #                                    │
│   # 4. Verify user_id in JWT matches   │
│   #    URL param (authorization)       │
│   #                                    │
│   # 5. Query DB:                       │
│   user = await repos.users.get_user_by_id(user_id)
│   #                                    │
│   # 6. Return 200 with user object     │
│   return {                             │
│     id: "117834567890",                │
│     email: "john@gmail.com",          │
│     name: "John Doe",                  │
│     avatar_url: "https://..."          │
│   }                                    │
└────────────────────────────────────────┘
            ▼
Frontend:
┌────────────────────────────────────────┐
│ Response: 200 OK                        │
│ {                                      │
│   id: "117834567890",                  │
│   email: "john@gmail.com",             │
│   name: "John Doe",                    │
│   avatar_url: "https://..."           │
│ }                                      │
│                                        │
│ Render user info on profile page       │
└────────────────────────────────────────┘
```

---

## Cache Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                      REDIS CACHE LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Pattern 1: User Preferences (HOT)                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Key: user:117834567890:preferences                     │   │
│  │ Value: JSON                                             │   │
│  │ {                                                       │   │
│  │   "email_notifications": true,                         │   │
│  │   "default_locale": "in",                             │   │
│  │   "default_sort": "trust_score_desc"                 │   │
│  │ }                                                       │   │
│  │ TTL: 72 hours                                          │   │
│  │ Invalidation: On PUT /preferences endpoint             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Pattern 2: Saved Products List (WARM)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Key: user:117834567890:saved-products:page:1           │   │
│  │ Value: Array                                            │   │
│  │ [                                                       │   │
│  │   {                                                    │   │
│  │     "product_id": "uuid-boat-airdopes",              │   │
│  │     "product_name": "boAt Airdopes 121",             │   │
│  │     "trust_score": 8.2                                │   │
│  │   },                                                   │   │
│  │   ...                                                  │   │
│  │ ]                                                       │   │
│  │ TTL: 24 hours                                          │   │
│  │ Invalidation: On POST/DELETE saved-products endpoint   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Pattern 3: Email Batch Stats (COLD)                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Key: email:batch:2026-06-06:10:25:00                   │   │
│  │ Value: JSON                                             │   │
│  │ {                                                       │   │
│  │   "processed": 50,                                     │   │
│  │   "sent": 48,                                          │   │
│  │   "failed": 2,                                         │   │
│  │   "completed_at": "2026-06-06T10:26:00Z"             │   │
│  │ }                                                       │   │
│  │ TTL: 1 hour (for monitoring dashboard)                │   │
│  │ Invalidation: On email_sender completion              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Relationships (ER Diagram)

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ email (UNIQUE)  │
│ google_id       │
│ name            │
│ avatar_url      │
│ created_at      │
└────────┬────────┘
         │
         │ 1:1
         │
         ├────────────────────────────────────┐
         │                                    │
         ▼                                    ▼
┌──────────────────────┐         ┌─────────────────────────┐
│  user_preferences    │         │  saved_products         │
├──────────────────────┤         ├─────────────────────────┤
│ id (PK)              │         │ id (PK)                 │
│ user_id (FK,UNIQUE)  │◄────────│ user_id (FK)            │
│ email_notifications  │   │:N   │ product_id (FK)         │
│ default_locale       │         │ created_at              │
│ default_sort         │         │ UNIQUE(user_id,product) │
│ created_at           │         └────────────┬────────────┘
└──────────────────────┘                      │ N:1
                                              │
                                              │
┌──────────────────────┐                      │
│  saved_searches      │                      │
├──────────────────────┤                      │
│ id (PK)              │                      │
│ user_id (FK)         │                      │
│ query                │                      │
│ filters (JSON)       │                      │
│ category             │                      │
│ created_at           │                      │
│ last_searched        │                      │
└──────────────────────┘                      │
                                              │
         ┌────────────────────────────────────┘
         │
         ▼
    ┌──────────────┐
    │   products   │
    ├──────────────┤
    │ id (PK)      │
    │ name         │
    │ slug         │
    │ category     │
    │ brand        │
    │ locale       │
    │ created_at   │
    └──────┬───────┘
           │ 1:N
           │
           ├──────────────┬──────────────┬─────────────┐
           │              │              │             │
           ▼              ▼              ▼             ▼
    ┌──────────────┐ ┌─────────────┐ ┌──────────────┐ ┌──────────────┐
    │   verdicts   │ │   emails    │ │ affiliate_   │ │email_captures│
    ├──────────────┤ ├─────────────┤ │   links      │ ├──────────────┤
    │ id (PK)      │ │ id (PK)     │ ├──────────────┤ │ id (PK)      │
    │ product_id   │ │ recipient   │ │ id (PK)      │ │ email        │
    │ (FK)────────┐│ │ subject     │ │ product_id   │ │ product_name │
    │ trust_score  │ │ body        │ │ (FK)         │ │ created_at   │
    │ summary      │ │ status      │ │ amazon_url   │ │ notified     │
    │ pros         │ │ verdict_id  │ │ tracking_code│ └──────────────┘
    │ cons         │ │ (FK)───────┘│ │ click_count  │
    │ ...          │ │ resend_id   │ │ created_at   │
    │ created_at   │ │ sent_at     │ └──────────────┘
    │ expires_at   │ │ created_at  │
    └──────────────┘ └─────────────┘
           │
           │ 1:N
           │
           ▼
    ┌──────────────────┐
    │ review_highlights │
    ├──────────────────┤
    │ id (PK)          │
    │ verdict_id (FK)  │
    │ source           │
    │ text             │
    │ rating           │
    │ auth_score       │
    │ created_at       │
    └──────────────────┘
```

---

## Deployment Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                   PHASE 2 DEPLOYMENT SEQUENCE                    │
└──────────────────────────────────────────────────────────────────┘

Week 1: Infrastructure + Backend
┌──────────────────────────────────────────────────────────────────┐
│ Day 1-2: Database Schema                                         │
│ ├─ CREATE TABLE saved_products (...)                            │
│ ├─ ALTER users ADD CONSTRAINT unique(email)                     │
│ ├─ CREATE INDEX idx_saved_products_user_id                      │
│ └─ Migration tested locally ✓                                   │
└──────────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ Day 2-3: Backend Email Sender                                    │
│ ├─ Implement: workers/email_sender.py                           │
│ ├─ Wire into: pipeline/orchestrator.py                          │
│ ├─ Test locally with mock Resend API                           │
│ ├─ Deploy: railway up --env=staging                            │
│ └─ Verify: Email queue processes in staging DB                 │
└──────────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ Day 3-4: Backend OAuth + Users                                   │
│ ├─ Implement: routes/auth.py (oauth-callback)                  │
│ ├─ Implement: routes/users.py endpoints                        │
│ ├─ Test locally with mocked NextAuth session                   │
│ ├─ Deploy: railway up --env=staging                            │
│ └─ Verify: POST /oauth-callback creates users in DB            │
└──────────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ Day 4-5: Backend Saved Products                                  │
│ ├─ Implement: routes/users.py (saved-products endpoints)      │
│ ├─ Implement: db/repositories/saved_products.py               │
│ ├─ Test locally with CRUD operations                          │
│ ├─ Deploy: railway up --env=staging                           │
│ └─ Verify: All endpoints return correct responses              │
└──────────────────────────────────────────────────────────────────┘

Week 2: Frontend + Integration
┌──────────────────────────────────────────────────────────────────┐
│ Day 5-6: Frontend NextAuth Integration                           │
│ ├─ Update: api/auth/[...nextauth]/route.ts (callbacks)         │
│ ├─ Test locally: Google OAuth flow                             │
│ │  (Use OAuth app in dev, test with real Google account)       │
│ ├─ Deploy: vercel deploy --env=staging                         │
│ └─ Verify: Post-login redirects to profile page                │
└──────────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ Day 6-7: Frontend Profile + Favorites                            │
│ ├─ Build: app/[locale]/profile/page.tsx                        │
│ ├─ Build: components/SaveButton.tsx                            │
│ ├─ Integrate SaveButton into VerdictCard                       │
│ ├─ Test locally:                                               │
│ │  - Login flow                                                 │
│ │  - View profile                                               │
│ │  - Save/unsave products                                      │
│ ├─ Deploy: vercel deploy --env=staging                         │
│ └─ Verify: All features working end-to-end                     │
└──────────────────────────────────────────────────────────────────┘

Week 2 (Late): Full Integration + QA
┌──────────────────────────────────────────────────────────────────┐
│ Day 7-8: E2E Testing                                             │
│ ├─ Test flow 1: Submit → Email                                 │
│ ├─ Test flow 2: Login → Save → Profile                         │
│ ├─ Test edge cases:                                            │
│ │  - Duplicate email submissions                               │
│ │  - Invalid product IDs                                       │
│ │  - Session timeout                                           │
│ ├─ Load test: Email sender with 1000 pending emails           │
│ └─ All tests passing ✓                                         │
└──────────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ Day 8-9: Production Deployment                                   │
│ ├─ Database migration on production:                           │
│ │  SET search_path TO "public";                                │
│ │  CREATE TABLE saved_products (...);                          │
│ │  (Verified on staging first)                                │
│ │                                                              │
│ ├─ Backend deployment:                                         │
│ │  git push → Railway auto-deploy                             │
│ │  Verify: /api/v1/health returns 200                         │
│ │                                                              │
│ ├─ Frontend deployment:                                        │
│ │  git push → Vercel auto-deploy                              │
│ │  Verify: Site loads, /profile accessible                    │
│ │                                                              │
│ └─ Env vars set:                                               │
│    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET    │
│    (Already in production, just verify)                        │
└──────────────────────────────────────────────────────────────────┘

Week 2 (Final): Monitoring + Hotfix
┌──────────────────────────────────────────────────────────────────┐
│ Day 9-10: Post-Launch Monitoring                                │
│ ├─ Monitor Sentry for errors                                   │
│ ├─ Check email delivery (Resend dashboard)                     │
│ ├─ Monitor DB query performance (slowlog)                      │
│ ├─ Check cache hit rate (Redis metrics)                        │
│ │                                                              │
│ └─ Hotfixes (if needed):                                       │
│    - Email template styling issues                             │
│    - OAuth callback timing (increase timeout)                  │
│    - Pagination edge cases (limit = 0)                         │
└──────────────────────────────────────────────────────────────────┘
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-06  
**Architecture Reviewed By:** Claude Code
