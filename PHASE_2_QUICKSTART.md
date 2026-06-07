# Phase 2 Quick-Start Implementation Checklist

This document is your day-by-day guide to building Phase 2. Copy sections into CLAUDE.md before each session.

---

## Pre-Implementation: Setup

```bash
# Install any new dependencies (already satisfied):
pip install sqlalchemy asyncpg  # Backend ORM (existing)
pip install httpx                # For Resend API (existing)
# npm packages already include next-auth, react

# Verify environment variables are set:
echo $RESEND_API_KEY              # Should exist
echo $GOOGLE_CLIENT_ID            # Should exist
echo $GOOGLE_CLIENT_SECRET        # Should exist
echo $NEXTAUTH_SECRET             # Should exist

# Start local dev stack:
docker-compose up -d             # PostgreSQL + Redis
npm run dev                       # Next.js (port 3000)
python -m uvicorn backend.main:app --reload  # FastAPI (port 8000)
```

---

## WEEK 1: EMAIL NOTIFICATIONS

### Day 1-2: Email Sender Worker

**Your goal:** Create a background worker that processes pending emails.

**Copy this into CLAUDE.md:**

```
I am building TrustLens Phase 2 Email Notifications.

Current status:
- Database: email_captures & emails tables exist ✓
- Email service (Resend API integration): exists ✓
- Missing: Background worker to process pending emails

Today I am building: `/backend/workers/email_sender.py`
Input:
  - Pending emails from DB (EmailModel with status='pending')
  - Product verdict info (summary, trust_score)
  - User email + product name
Expected output:
  - Send via Resend API
  - Update email status to 'sent' or 'failed'
  - Return {processed: int, sent: int, failed: int}

Please review the plan and show your approach before coding.
After building:
- Write tests covering: happy path, API failure, missing data, duplicate sends
- Wire into orchestrator.py on verdict completion
```

**Files to create/modify:**
- Create: `/backend/workers/email_sender.py`
- Create: `/backend/tests/test_email_sender.py`
- Modify: `/backend/pipeline/orchestrator.py` (add trigger on verdict completion)

**Pseudo-code reference (in email_sender.py):**

```python
async def process_pending_emails(session: AsyncSession) -> dict:
    """Main worker function. Call every 1 minute."""
    
    # 1. Fetch pending emails
    pending = await repos.emails.get_pending_emails(session, limit=50)
    
    stats = {"processed": 0, "sent": 0, "failed": 0}
    
    for email_model in pending:
        stats["processed"] += 1
        
        try:
            # 2. Send via Resend
            resend_id = await EmailService.send_verdict_notification(
                recipient_email=email_model.recipient,
                product_name=email_model.product_name or "Your Product",
                verdict_summary=email_model.summary or "Coming soon...",
                trust_score=email_model.trust_score or 0.0,
                verdict_url=email_model.verdict_url or "https://trustlens.in",
            )
            
            # 3. Update to 'sent'
            await repos.emails.update_email_status(
                session,
                email_model.id,
                status="sent",
                resend_id=resend_id,
            )
            stats["sent"] += 1
            
        except Exception as e:
            # 4. Update to 'failed'
            await repos.emails.update_email_status(
                session,
                email_model.id,
                status="failed",
                error_message=str(e),
            )
            stats["failed"] += 1
    
    await session.commit()
    return stats


async def send_notification_on_verdict_completion(
    session: AsyncSession,
    product_id: UUID,
    verdict_summary: str,
    trust_score: float,
) -> int:
    """Called when a new verdict is created. Notify waiting emails."""
    
    # 1. Find product name
    product = await repos.products.get_by_id(session, product_id)
    if not product:
        return 0
    
    # 2. Find all email_captures for this product
    email_captures = await repos.email_captures.find_by_product(
        session, product.name
    )
    
    count = 0
    for capture in email_captures:
        # 3. Create Email record for sending
        await repos.emails.create_email(
            session,
            recipient=capture.email,
            subject=f"Your TrustLens verdict for {product.name} is ready!",
            body=f"Trust score: {trust_score}/10\n\n{verdict_summary}",
            verdict_id=product_id,
            email_capture_id=capture.id,
        )
        count += 1
        
        # 4. Mark as notified (prevent re-sending)
        capture.notified = True
    
    await session.commit()
    return count
```

**Testing checklist:**
- [ ] `test_process_pending_emails_happy_path()` — Send 3 emails, all succeed
- [ ] `test_process_pending_emails_api_failure()` — Resend API returns 500
- [ ] `test_process_pending_emails_missing_data()` — Email has null product_name
- [ ] `test_process_pending_emails_batch()` — Process 50 in one run
- [ ] `test_send_notification_on_verdict()` — Find captures, create emails

**Integration test:**
- [ ] Submit product → Verdict created → Email queued → Status='sent' in DB

---

### Day 2-3: Wire Background Job into Pipeline

**Your goal:** Make email notifications trigger automatically when verdicts are created.

**Copy this into CLAUDE.md:**

```
I am building the Email Notifications trigger.

Current status:
- Email sender worker ready ✓
- Orchestrator creates verdicts in pipeline/orchestrator.py
- Missing: Call email_sender when verdict completes

Today I am building: Integration point in `orchestrator.py`
Input: Completed verdict (product_id, trust_score, summary)
Expected output: Email queued and status updated

Changes needed:
1. In orchestrator.run_pipeline() after verdict creation
2. Call email_sender.send_notification_on_verdict_completion(...)
3. Commit transaction
4. Log success/failure

After building:
- Test end-to-end: submit product → fetch verdict → check emails queued
- Verify duplicate emails not sent
```

**Pseudo-code (in orchestrator.py):**

```python
# In orchestrator.run_pipeline():

# ... existing code creates verdict ...

if verdict:
    logger.info(f"Verdict created for {product_id}")
    
    # NEW: Trigger email notifications
    try:
        from backend.workers import email_sender
        
        count = await email_sender.send_notification_on_verdict_completion(
            session,
            product_id=product_id,
            verdict_summary=verdict.summary or "",
            trust_score=float(verdict.trust_score or 0),
        )
        
        if count > 0:
            logger.info(f"Queued {count} notification emails")
            await session.commit()
    except Exception as e:
        logger.error(f"Failed to queue notifications: {e}")
        await session.rollback()
```

**Verification:**
- [ ] Run orchestrator.run_pipeline() with test product
- [ ] Check emails table: should have 1-N new records with status='pending'
- [ ] Run email_sender.process_pending_emails() manually
- [ ] Verify status changed to 'sent'

---

### Day 3-4: Notification Preferences API

**Your goal:** Let users toggle email notifications.

**Copy this into CLAUDE.md:**

```
I am building Notification Preferences endpoints.

Current status:
- Email system working end-to-end ✓
- UserPreferencesModel exists with email_notifications field
- Missing: API endpoints to GET/PUT preferences

Today I am building: `/backend/routes/notifications.py`
Input:
  - User ID (from JWT token)
  - Preference update: {email_notifications: bool}
Expected output:
  - GET: Current preferences {email_notifications, locale, sort}
  - PUT: Updated preferences + updated_at timestamp
  - 401 if not authenticated

After building:
- Test: Anonymous user gets 401
- Test: Auth user can GET/PUT preferences
- Test: Updated values persist to DB
```

**New file: `/backend/routes/notifications.py`:**

```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.connection import get_db_session
from backend.db import repositories as repos
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


class PreferenceUpdate(BaseModel):
    email_notifications: bool | None = None


class PreferenceResponse(BaseModel):
    user_id: str
    email_notifications: bool
    default_locale: str
    default_sort: str
    updated_at: str  # ISO format


async def get_current_user(request: Request) -> str:
    """Extract user_id from JWT (from auth middleware)."""
    # This is a helper — implement based on your auth pattern
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    # Decode JWT here (use jwt library + NEXTAUTH_SECRET)
    # For now: assume request.state.user_id is set by middleware
    if not hasattr(request.state, "user_id"):
        raise HTTPException(status_code=401, detail="Invalid token")
    return request.state.user_id


@router.post("/preferences")
async def update_preferences(
    request: PreferenceUpdate,
    session: AsyncSession = Depends(get_db_session),
    user_id: str = Depends(get_current_user),
):
    """Update user notification preferences."""
    logger.info(f"Updating preferences for user {user_id}")
    
    prefs = await repos.users.update_preferences(
        session,
        user_id=user_id,
        email_notifications=request.email_notifications,
    )
    
    await session.commit()
    
    return PreferenceResponse(
        user_id=user_id,
        email_notifications=prefs.email_notifications,
        default_locale=prefs.default_locale,
        default_sort=prefs.default_sort,
        updated_at=prefs.updated_at.isoformat(),
    )


@router.get("/history")
async def get_email_history(
    status: str | None = None,
    limit: int = 20,
    offset: int = 0,
    session: AsyncSession = Depends(get_db_session),
    user_id: str = Depends(get_current_user),
):
    """Get email history for authenticated user."""
    logger.info(f"Fetching email history for user {user_id}")
    
    # Query emails by recipient (user's email)
    user = await repos.users.get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # TODO: Implement get_emails_by_recipient() in repos.emails
    # For now: return mock
    return {
        "total": 0,
        "emails": [],
        "page": 1,
    }
```

**Testing checklist:**
- [ ] Anonymous user POST /notifications/preferences → 401
- [ ] Auth user PUT /preferences {email_notifications: false} → 200
- [ ] Verify DB updated: email_notifications = false
- [ ] GET /notifications/history → returns paginated list
- [ ] History is empty for new user

---

## WEEK 1-2: USER AUTHENTICATION

### Day 2-3: OAuth Callback Endpoint

**Your goal:** Sync user creation between NextAuth and your database.

**Copy this into CLAUDE.md:**

```
I am building OAuth Callback endpoint for user sync.

Current status:
- NextAuth.js configured with Google Provider ✓
- UserModel & UserPreferencesModel exist ✓
- Missing: Backend endpoint that NextAuth calls on signin

Today I am building: `/backend/routes/auth.py`
Input (from NextAuth signIn callback):
  {
    email: "user@gmail.com",
    name: "John Doe",
    google_id: "117834567890",
    avatar_url: "https://..."
  }
Expected output:
  {
    id: "google-117834567890",
    email: "user@gmail.com",
    name: "John Doe",
    created: true,  # New user vs returning
    google_id: "117834567890"
  }

Logic:
1. Check if user exists by google_id
2. If new: create UserModel + UserPreferencesModel
3. If exists: update name/avatar
4. Return user.id for JWT

After building:
- Test: New user creation (POST)
- Test: Returning user (no duplicate)
- Test: Missing required fields → 400
```

**New file: `/backend/routes/auth.py`:**

```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.connection import get_db_session
from backend.db import repositories as repos
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/users", tags=["auth"])


class OAuthCallbackRequest(BaseModel):
    email: EmailStr
    name: str | None = None
    google_id: str
    avatar_url: str | None = None


class OAuthCallbackResponse(BaseModel):
    id: str
    email: str
    name: str | None
    google_id: str
    avatar_url: str | None
    created: bool


@router.post("/oauth-callback", response_model=OAuthCallbackResponse)
async def oauth_callback(
    request: OAuthCallbackRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """
    Called by NextAuth.js signIn callback.
    Syncs user to database.
    """
    logger.info(f"OAuth callback for {request.email}")
    
    try:
        # 1. Check if user exists
        existing_user = await repos.users.get_user_by_google_id(
            session, request.google_id
        )
        
        if existing_user:
            # Update existing user
            logger.info(f"Updating existing user {existing_user.id}")
            existing_user.name = request.name or existing_user.name
            existing_user.avatar_url = request.avatar_url or existing_user.avatar_url
            await session.flush()
            
            return OAuthCallbackResponse(
                id=existing_user.id,
                email=existing_user.email,
                name=existing_user.name,
                google_id=existing_user.google_id,
                avatar_url=existing_user.avatar_url,
                created=False,
            )
        
        # 2. Create new user
        logger.info(f"Creating new user {request.email}")
        new_user = await repos.users.create_user(
            session,
            email=request.email,
            name=request.name,
            google_id=request.google_id,
            avatar_url=request.avatar_url,
        )
        
        # 3. Create default preferences
        await repos.users.get_or_create_preferences(session, new_user.id)
        
        await session.commit()
        
        return OAuthCallbackResponse(
            id=new_user.id,
            email=new_user.email,
            name=new_user.name,
            google_id=new_user.google_id,
            avatar_url=new_user.avatar_url,
            created=True,
        )
        
    except Exception as e:
        logger.error(f"OAuth callback failed: {e}")
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to sync user")
```

**Update NextAuth config: `/frontend/src/app/api/auth/[...nextauth]/route.ts`:**

```typescript
// Add to authOptions.callbacks:

async signIn({ user, account }) {
    if (!account) return true
    
    // Call backend to sync user
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/oauth-callback`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    name: user.name,
                    google_id: account.providerAccountId,
                    avatar_url: user.image,
                }),
            }
        )
        
        if (!res.ok) {
            console.error('Failed to sync user to backend')
            return false
        }
        
        const dbUser = await res.json()
        user.id = dbUser.id  // Store DB ID in JWT
        return true
    } catch (error) {
        console.error('OAuth callback error:', error)
        return false
    }
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
    }
    return session
}
```

**Testing checklist:**
- [ ] POST /oauth-callback with new user → 201, created=true
- [ ] POST /oauth-callback again → 200, created=false
- [ ] Verify UserModel created in DB
- [ ] Verify UserPreferencesModel created (default values)
- [ ] Missing email field → 400 Bad Request
- [ ] NextAuth calls endpoint on sign in (via logging)

---

### Day 3-4: User Profile Endpoints

**Your goal:** Build backend endpoints for user data retrieval.

**Copy this into CLAUDE.md:**

```
I am building User Profile endpoints.

Current status:
- OAuth callback working, users created in DB ✓
- Missing: Endpoints to GET user info, preferences, saved products

Today I am building: User endpoints in `/backend/routes/users.py`
Endpoints:
  GET /api/v1/users/{user_id}
    - Return: {id, email, name, avatar_url, created_at}
    - Requires: User is authenticated as same user_id
  
  GET /api/v1/users/{user_id}/preferences
    - Return: {email_notifications, default_locale, default_sort}
    - Requires: Authentication
  
  PUT /api/v1/users/{user_id}/preferences
    - Update: {email_notifications?, default_locale?, default_sort?}
    - Return: Updated preferences
  
  DELETE /api/v1/users/{user_id}
    - Delete user + all related data (cascade)

After building:
- Test: Unauthenticated requests → 401
- Test: User accessing another user's profile → 403
- Test: Valid requests → 200 with correct data
```

**Modify/create: `/backend/routes/users.py`:**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.connection import get_db_session
from backend.db import repositories as repos
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/users", tags=["users"])


class UserResponse(BaseModel):
    id: str
    email: str
    name: str | None
    avatar_url: str | None
    created_at: str


class PreferencesResponse(BaseModel):
    user_id: str
    email_notifications: bool
    default_locale: str
    default_sort: str
    updated_at: str


class PreferencesUpdate(BaseModel):
    email_notifications: Optional[bool] = None
    default_locale: Optional[str] = None
    default_sort: Optional[str] = None


async def get_current_user_id(request) -> str:
    """Extract user_id from JWT. Implement based on your auth pattern."""
    # For now: use request.state.user_id set by auth middleware
    if not hasattr(request.state, "user_id"):
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )
    return request.state.user_id


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    session: AsyncSession = Depends(get_db_session),
    current_user: str = Depends(get_current_user_id),
):
    """Get user profile. User can only see their own profile."""
    if user_id != current_user:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view this profile"
        )
    
    user = await repos.users.get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        created_at=user.created_at.isoformat() if user.created_at else None,
    )


@router.get("/{user_id}/preferences", response_model=PreferencesResponse)
async def get_preferences(
    user_id: str,
    session: AsyncSession = Depends(get_db_session),
    current_user: str = Depends(get_current_user_id),
):
    """Get user preferences."""
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    prefs = await repos.users.get_or_create_preferences(session, user_id)
    
    return PreferencesResponse(
        user_id=user_id,
        email_notifications=prefs.email_notifications,
        default_locale=prefs.default_locale,
        default_sort=prefs.default_sort,
        updated_at=prefs.updated_at.isoformat() if prefs.updated_at else None,
    )


@router.put("/{user_id}/preferences", response_model=PreferencesResponse)
async def update_preferences(
    user_id: str,
    update: PreferencesUpdate,
    session: AsyncSession = Depends(get_db_session),
    current_user: str = Depends(get_current_user_id),
):
    """Update user preferences."""
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    prefs = await repos.users.update_preferences(
        session,
        user_id=user_id,
        email_notifications=update.email_notifications,
        default_locale=update.default_locale,
        default_sort=update.default_sort,
    )
    
    await session.commit()
    
    return PreferencesResponse(
        user_id=user_id,
        email_notifications=prefs.email_notifications,
        default_locale=prefs.default_locale,
        default_sort=prefs.default_sort,
        updated_at=prefs.updated_at.isoformat() if prefs.updated_at else None,
    )


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: str,
    session: AsyncSession = Depends(get_db_session),
    current_user: str = Depends(get_current_user_id),
):
    """Delete user and all associated data (cascade)."""
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = await repos.users.get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # SQLAlchemy cascade handles related records
    await session.delete(user)
    await session.commit()
```

**Testing checklist:**
- [ ] GET /users/{user_id} without auth → 401
- [ ] GET /users/other-id as different user → 403
- [ ] GET /users/my-id as authenticated → 200 with correct data
- [ ] GET /users/nonexistent → 404
- [ ] PUT /users/{user_id}/preferences with updates → 200
- [ ] DELETE /users/{user_id} → 204 and user gone from DB

---

### Day 4-5: Save to Favorites Backend

**Your goal:** Implement saved products CRUD endpoints.

**Copy this into CLAUDE.md:**

```
I am building Save to Favorites feature (backend).

Current status:
- User authentication working ✓
- Profile endpoints ready ✓
- Missing: Backend for saved products
- Missing: Database table `saved_products`

Today I am building:
1. Database migration: CREATE TABLE saved_products
2. Repository: `/backend/db/repositories/saved_products.py`
3. Routes: POST/GET/DELETE /api/v1/users/{user_id}/saved-products

Input/Output:
  POST /users/{id}/saved-products
    Input: {product_id: UUID}
    Output: {id, user_id, product_id, created_at}
  
  GET /users/{id}/saved-products?page=1&limit=20
    Output: {total, page, limit, products: [{product_id, name, score, saved_at}]}
  
  DELETE /users/{id}/saved-products/{product_id}
    Output: 204 No Content

After building:
- Test: Save product (idempotent)
- Test: Unsave product
- Test: List with pagination
- Test: Invalid product_id → 404
```

**Step 1: Database migration (run locally):**

```sql
-- Run in psql:
CREATE TABLE saved_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

CREATE INDEX idx_saved_products_user_id ON saved_products(user_id);

-- Verify:
\dt saved_products
```

**Step 2: Add model to `/backend/db/models.py`:**

```python
from sqlalchemy import UniqueConstraint

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

**Step 3: Create repository `/backend/db/repositories/saved_products.py`:**

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.models import SavedProductModel
from uuid import UUID
import uuid


async def create(
    session: AsyncSession,
    user_id: str,
    product_id: UUID,
) -> SavedProductModel:
    """Save a product for user."""
    saved = SavedProductModel(
        user_id=user_id,
        product_id=product_id,
    )
    session.add(saved)
    await session.flush()
    return saved


async def delete(
    session: AsyncSession,
    user_id: str,
    product_id: UUID,
) -> bool:
    """Remove saved product."""
    stmt = select(SavedProductModel).where(
        (SavedProductModel.user_id == user_id) &
        (SavedProductModel.product_id == product_id)
    )
    result = await session.execute(stmt)
    saved = result.scalars().first()
    
    if saved:
        await session.delete(saved)
        await session.flush()
        return True
    return False


async def get_by_user(
    session: AsyncSession,
    user_id: str,
    page: int = 1,
    limit: int = 20,
) -> tuple[int, list[dict]]:
    """Get paginated saved products for user."""
    # Count total
    count_stmt = select(SavedProductModel).where(
        SavedProductModel.user_id == user_id
    )
    count_result = await session.execute(count_stmt)
    total = len(count_result.scalars().all())
    
    # Get paginated results
    offset = (page - 1) * limit
    stmt = (
        select(SavedProductModel)
        .where(SavedProductModel.user_id == user_id)
        .order_by(SavedProductModel.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await session.execute(stmt)
    saved_products = result.scalars().all()
    
    # TODO: Join with products table to get product details
    # For now: return basic structure
    products = [
        {
            "product_id": str(sp.product_id),
            "product_name": "TODO: JOIN products",
            "trust_score": None,
            "saved_at": sp.created_at.isoformat() if sp.created_at else None,
        }
        for sp in saved_products
    ]
    
    return total, products


async def exists(
    session: AsyncSession,
    user_id: str,
    product_id: UUID,
) -> bool:
    """Check if product is saved."""
    stmt = select(SavedProductModel).where(
        (SavedProductModel.user_id == user_id) &
        (SavedProductModel.product_id == product_id)
    )
    result = await session.execute(stmt)
    return result.scalars().first() is not None
```

**Step 4: Add routes to `/backend/routes/users.py`:**

```python
from backend.db.repositories import saved_products as saved_products_repo

class SaveProductRequest(BaseModel):
    product_id: str  # UUID as string

class SavedProductResponse(BaseModel):
    product_id: str
    product_name: str
    trust_score: float | None
    saved_at: str

@router.post("/{user_id}/saved-products")
async def save_product(
    user_id: str,
    request: SaveProductRequest,
    session: AsyncSession = Depends(get_db_session),
    current_user: str = Depends(get_current_user_id),
):
    """Save a product to user's favorites."""
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    product_id = UUID(request.product_id)
    
    # Verify product exists
    product = await repos.products.get_by_id(session, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if already saved
    already_saved = await saved_products_repo.exists(session, user_id, product_id)
    if already_saved:
        raise HTTPException(
            status_code=409,
            detail="Product already saved"
        )
    
    # Save it
    saved = await saved_products_repo.create(session, user_id, product_id)
    await session.commit()
    
    return {
        "id": str(saved.id),
        "user_id": user_id,
        "product_id": str(product_id),
        "created_at": saved.created_at.isoformat(),
    }


@router.delete("/{user_id}/saved-products/{product_id}", status_code=204)
async def unsave_product(
    user_id: str,
    product_id: str,
    session: AsyncSession = Depends(get_db_session),
    current_user: str = Depends(get_current_user_id),
):
    """Remove product from favorites."""
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    pid = UUID(product_id)
    deleted = await saved_products_repo.delete(session, user_id, pid)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Saved product not found")
    
    await session.commit()


@router.get("/{user_id}/saved-products")
async def get_saved_products(
    user_id: str,
    page: int = 1,
    limit: int = 20,
    session: AsyncSession = Depends(get_db_session),
    current_user: str = Depends(get_current_user_id),
):
    """Get user's saved products."""
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    total, products = await saved_products_repo.get_by_user(
        session, user_id, page, limit
    )
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "products": products,
    }
```

**Testing checklist:**
- [ ] POST /users/{id}/saved-products with valid product → 201
- [ ] POST again → 409 Conflict
- [ ] GET /users/{id}/saved-products → returns list with 1 item
- [ ] DELETE /users/{id}/saved-products/{product_id} → 204
- [ ] GET again → list empty
- [ ] Invalid product_id → 404
- [ ] Unauthorized user → 403

---

## WEEK 2: FRONTEND

### Day 5-6: Profile Page

**Your goal:** Build user profile page with all sections.

**Copy this into CLAUDE.md:**

```
I am building User Profile page.

Current status:
- Backend user endpoints ready ✓
- NextAuth session working ✓
- Missing: Frontend profile page + components

Today I am building: `/frontend/src/app/[locale]/profile/page.tsx`
Features:
  - Display user info (avatar, name, email, joined date)
  - Toggle email notifications
  - List saved products
  - Logout button
  - Require authentication (redirect if not logged in)

Architecture:
  - Server component (SSR) for initial data fetch
  - Client component for interactive sections
  - Fetch user, preferences, saved products on mount

After building:
- Test: Visit /profile without auth → redirects to /auth/signin
- Test: Logged in → see user info + saved products
- Test: Toggle email notifications → API call + UI update
- Test: Logout → redirects to home
```

**Create: `/frontend/src/app/[locale]/profile/page.tsx`:**

```typescript
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import ProfileSection from '@/components/ProfileSection'
import NotificationPreferences from '@/components/NotificationPreferences'
import SavedProductsList from '@/components/SavedProductsList'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const session = await getServerSession()
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }
  
  const { locale } = await params
  
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8">My Profile</h1>
      
      <div className="space-y-8">
        <ProfileSection userId={session.user.id} />
        <NotificationPreferences userId={session.user.id} />
        <SavedProductsList userId={session.user.id} locale={locale} />
      </div>
    </div>
  )
}
```

**Create: `/frontend/src/components/ProfileSection.tsx`:**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'

export default function ProfileSection({ userId }: { userId: string }) {
  const { data: session } = useSession()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${session?.user?.id}`,
            },
          }
        )
        if (res.ok) {
          setUser(await res.json())
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) fetchUser()
  }, [userId, session])

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Failed to load profile</div>

  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200">
      <div className="flex items-center space-x-6">
        {user.avatar_url && (
          <Image
            src={user.avatar_url}
            alt={user.name}
            width={80}
            height={80}
            className="rounded-full"
          />
        )}
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{user.name || 'Unknown'}</h2>
          <p className="text-gray-600">{user.email}</p>
          <p className="text-sm text-gray-400">
            Joined {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          🚪 Sign Out
        </button>
      </div>
    </div>
  )
}
```

**Create: `/frontend/src/components/NotificationPreferences.tsx`:**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function NotificationPreferences({ userId }: { userId: string }) {
  const { data: session } = useSession()
  const [prefs, setPrefs] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${userId}/preferences`
        )
        if (res.ok) {
          setPrefs(await res.json())
        }
      } catch (error) {
        console.error('Failed to fetch preferences:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) fetchPrefs()
  }, [userId])

  const handleToggle = async (field: string, value: boolean) => {
    setUpdating(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${userId}/preferences`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value }),
        }
      )
      if (res.ok) {
        setPrefs(await res.json())
      }
    } catch (error) {
      console.error('Failed to update preferences:', error)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div>Loading preferences...</div>
  if (!prefs) return <div>Failed to load preferences</div>

  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200">
      <h3 className="text-xl font-bold mb-6">Notification Preferences</h3>
      
      <div className="space-y-4">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={prefs.email_notifications}
            onChange={(e) => handleToggle('email_notifications', e.target.checked)}
            disabled={updating}
            className="w-5 h-5"
          />
          <span>Email me when new verdicts are ready</span>
        </label>
      </div>
      
      <button
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        disabled={updating}
      >
        {updating ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}
```

**Create: `/frontend/src/components/SavedProductsList.tsx`:**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function SavedProductsList({
  userId,
  locale,
}: {
  userId: string
  locale: string
}) {
  const { data: session } = useSession()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${userId}/saved-products?page=1&limit=20`
        )
        if (res.ok) {
          const data = await res.json()
          setProducts(data.products)
          setTotal(data.total)
        }
      } catch (error) {
        console.error('Failed to fetch saved products:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) fetchSaved()
  }, [userId])

  const handleUnsave = async (productId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${userId}/saved-products/${productId}`,
        { method: 'DELETE' }
      )
      if (res.ok) {
        setProducts(products.filter((p) => p.product_id !== productId))
        setTotal(total - 1)
      }
    } catch (error) {
      console.error('Failed to unsave product:', error)
    }
  }

  if (loading) return <div>Loading saved products...</div>

  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200">
      <h3 className="text-xl font-bold mb-6">
        Saved Products ({total})
      </h3>
      
      {products.length === 0 ? (
        <p className="text-gray-600">
          You haven't saved any products yet.{' '}
          <Link href={`/${locale}/search`} className="text-blue-600 hover:underline">
            Start exploring
          </Link>
        </p>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.product_id}
              className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50"
            >
              <div>
                <h4 className="font-semibold">{product.product_name}</h4>
                <p className="text-sm text-gray-600">
                  Trust Score: {product.trust_score || 'N/A'}/10
                </p>
                <p className="text-xs text-gray-400">
                  Saved {new Date(product.saved_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleUnsave(product.product_id)}
                className="text-red-600 hover:text-red-800"
              >
                ❤️ Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Testing checklist:**
- [ ] Unauthenticated user visits /profile → redirects to /auth/signin
- [ ] Authenticated user → sees profile section with avatar, name, email
- [ ] Toggle email notification → API called, UI updates
- [ ] View saved products → list displays
- [ ] Click "Remove" → product removed from list
- [ ] Click "Sign Out" → redirects to home, session cleared

---

### Day 5-6: Save Button Component

**Your goal:** Add heart button to VerdictCard for authenticated users.

**Copy this into CLAUDE.md:**

```
I am building Save Button for verdict cards.

Current status:
- Backend saved products endpoints ready ✓
- Profile page built ✓
- Missing: Save button on VerdictCard
- Missing: Logic to toggle save state

Today I am building: SaveButton component
Features:
  - Only shows if logged in (check session)
  - Shows "❤️ Saved" if already saved
  - Shows "🤍 Save" if not saved
  - Click toggles save state
  - Shows toast on success
  - Shows login prompt if not authenticated

After building:
- Test: Logged-in user can save/unsave
- Test: Unauthenticated user sees login prompt
- Test: Button updates immediately (optimistic UI)
```

**Create: `/frontend/src/components/SaveButton.tsx`:**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import LoginButton from './LoginButton'

interface SaveButtonProps {
  productId: string
  productName: string
  onSaveChange?: (isSaved: boolean) => void
}

export default function SaveButton({
  productId,
  productName,
  onSaveChange,
}: SaveButtonProps) {
  const { data: session } = useSession()
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Check if product is saved on mount
  useEffect(() => {
    if (!session?.user?.id) return

    const checkSaved = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${session.user.id}/saved-products`
        )
        if (res.ok) {
          const data = await res.json()
          const saved = data.products.some((p: any) => p.product_id === productId)
          setIsSaved(saved)
        }
      } catch (error) {
        console.error('Failed to check saved status:', error)
      }
    }

    checkSaved()
  }, [session?.user?.id, productId])

  const handleToggleSave = async () => {
    if (!session?.user?.id) return

    setLoading(true)
    try {
      if (isSaved) {
        // Unsave
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${session.user.id}/saved-products/${productId}`,
          { method: 'DELETE' }
        )
        if (res.ok) {
          setIsSaved(false)
          setToastMessage(`Removed ${productName} from favorites`)
          onSaveChange?.(false)
        }
      } else {
        // Save
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${session.user.id}/saved-products`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId }),
          }
        )
        if (res.ok) {
          setIsSaved(true)
          setToastMessage(`Added ${productName} to favorites`)
          onSaveChange?.(true)
        } else if (res.status === 409) {
          // Already saved
          setIsSaved(true)
          setToastMessage('Already saved')
        }
      }
      
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    } catch (error) {
      console.error('Failed to toggle save:', error)
      setToastMessage('Failed to save product')
      setShowToast(true)
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return <LoginButton size="sm" variant="ghost" />
  }

  return (
    <>
      <button
        onClick={handleToggleSave}
        disabled={loading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-semibold
          transition disabled:opacity-50
          ${
            isSaved
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
        `}
      >
        {isSaved ? '❤️ Saved' : '🤍 Save'}
      </button>

      {showToast && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg">
          {toastMessage}
        </div>
      )}
    </>
  )
}
```

**Modify: `/frontend/src/components/VerdictCard/index.tsx`:**

```typescript
// Add import at top:
import SaveButton from '@/components/SaveButton'

// In the verdict card JSX, add SaveButton near the title:
export default function VerdictCard({ verdict, locale }: VerdictCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* ... existing code ... */}
      
      <div className="flex items-start justify-between p-6 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-bold">{verdict.product_name}</h2>
          <p className="text-gray-600">{verdict.brand}</p>
        </div>
        <SaveButton
          productId={verdict.product_id}
          productName={verdict.product_name}
        />
      </div>
      
      {/* ... rest of card ... */}
    </div>
  )
}
```

**Testing checklist:**
- [ ] Unauthenticated user sees "Sign in with Google" instead of save button
- [ ] Authenticated user sees "🤍 Save" button
- [ ] Click save → "❤️ Saved" + toast message
- [ ] Click unsave → "🤍 Save" + toast message
- [ ] Refresh page → button state persists
- [ ] Click save on multiple products → all show saved state

---

### Day 6-7: NavBar + User Menu

**Your goal:** Add profile link and user menu to navigation.

**Copy this into CLAUDE.md:**

```
I am building Navigation updates for authenticated users.

Current status:
- Profile page ready ✓
- Save button ready ✓
- Missing: Profile link + user menu in NavBar

Today I am building: Updates to NavBar component
Features:
  - Show LoginButton if not authenticated
  - Show UserMenu (avatar dropdown) if authenticated
  - Dropdown: [Profile] [Settings] [Sign Out]
  - Mobile responsive

After building:
- Test: Unauthenticated → shows Login button
- Test: Authenticated → shows avatar + dropdown
- Test: Dropdown has correct links
- Test: Sign out clears session
```

**Modify: `/frontend/src/components/home/NavBar.tsx`:**

```typescript
'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import LoginButton from '@/components/LoginButton'

export default function NavBar({ locale = 'in' }: { locale?: string }) {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="font-bold text-2xl text-blue-600">
          TrustLens
        </Link>

        {/* Center: Links */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href={`/${locale}/search`} className="hover:text-blue-600">
            Search
          </Link>
          <Link href={`/${locale}/submit`} className="hover:text-blue-600">
            Submit
          </Link>
          <Link href={`/${locale}/methodology`} className="hover:text-blue-600">
            Methodology
          </Link>
        </div>

        {/* Right: Auth Section */}
        <div className="flex items-center space-x-4">
          {!session ? (
            <LoginButton />
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition"
              >
                {session.user?.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                )}
                <span className="font-semibold">{session.user?.name}</span>
                <span className="text-gray-400">▼</span>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <Link
                    href={`/${locale}/profile`}
                    className="block px-4 py-2 hover:bg-gray-100 border-b"
                  >
                    👤 Profile
                  </Link>
                  <Link
                    href={`/${locale}/profile#notifications`}
                    className="block px-4 py-2 hover:bg-gray-100 border-b"
                  >
                    ⚙️ Preferences
                  </Link>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/' })
                      setShowUserMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
```

**Testing checklist:**
- [ ] Unauthenticated user sees "Sign in with Google" button
- [ ] Authenticated user sees avatar + name
- [ ] Click avatar → dropdown opens with Profile, Preferences, Sign Out
- [ ] Click Profile → navigate to /[locale]/profile
- [ ] Click Sign Out → clears session, redirects home
- [ ] Close dropdown when clicking elsewhere

---

## WEEK 2 (Final): Integration & Deployment

### Day 7-8: Full E2E Testing

**Your goal:** Test entire flow end-to-end.

**Copy this into CLAUDE.md:**

```
I am running Phase 2 E2E tests.

Test Flows:
1. Email Notifications
   - Visit /submit
   - Enter: product="boAt Airdopes 121", email="test@example.com"
   - Manually trigger orchestrator.run_pipeline() (use admin?)
   - Check emails table: new record with status='pending'
   - Run email_sender.process_pending_emails()
   - Verify status='sent'
   - Verify email received (check Resend dashboard or test inbox)

2. Authentication
   - Click "Sign in with Google"
   - Complete OAuth flow
   - Verify DB: UserModel created
   - Verify JWT in cookie
   - Verify session.user.id set

3. Save to Favorites
   - Login
   - Navigate to product
   - Click "🤍 Save"
   - Verify UI: "❤️ Saved"
   - Verify DB: SavedProductModel created
   - Navigate to /profile
   - Verify saved product listed
   - Click "Remove"
   - Verify DB: deleted
   - Verify UI: list empty

4. Profile Page
   - Login
   - Visit /profile
   - Verify user info displayed
   - Toggle email notification
   - Verify DB: user_preferences updated
   - Logout
   - Verify redirected to /

Edge Cases:
- Duplicate submissions
- Invalid product IDs
- Session timeout
- Network failures
```

**Manual testing checklist:**
- [ ] Submit product, receive email
- [ ] Login, access profile without errors
- [ ] Save multiple products, see all in profile
- [ ] Preferences toggle works
- [ ] Logout works
- [ ] Mobile responsive (test on phone/tablet)
- [ ] No console errors
- [ ] API calls logged (check server logs)

**Automated tests to write:**
- [ ] `test_phase2_email_flow()` — E2E email
- [ ] `test_phase2_auth_flow()` — E2E login
- [ ] `test_phase2_save_flow()` — E2E favorites
- [ ] Run existing test suite — all 49+ tests pass

---

### Day 8-9: Production Deployment

**Deployment checklist:**

```bash
# 1. Database migration (production)
# ssh into production DB server or use Neon console:
CREATE TABLE saved_products (...)
CREATE INDEX idx_saved_products_user_id ON saved_products(user_id)

# 2. Backend deployment
cd /Users/tusway/TrustLens
git add -A
git commit -m "feat: Phase 2 email notifications + user authentication"
git push origin main
# Railway auto-deploys on push
# Verify: curl https://api.trustlens.in/api/v1/health → 200

# 3. Frontend deployment
cd frontend
git add -A
git commit -m "feat: user profile + save to favorites UI"
git push origin main
# Vercel auto-deploys on push
# Verify: https://trustlens.in/in/profile → loads (or redirects to signin)

# 4. Verify env vars
# Check both platforms have:
# - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
# - NEXTAUTH_SECRET
# - RESEND_API_KEY

# 5. Smoke test
# - Visit https://trustlens.in
# - Login with Google
# - Go to /profile
# - Save a product
# - Logout
# - Submit product via /submit
# - Monitor: https://app.sentry.io for errors
```

**Post-deployment monitoring:**

- [ ] Check Sentry dashboard for errors (should be 0)
- [ ] Check Resend dashboard for email delivery rate (>95%)
- [ ] Query production DB: SELECT COUNT(*) FROM users → should increase
- [ ] Query production DB: SELECT COUNT(*) FROM saved_products → should increase
- [ ] Monitor Railway logs for slow queries
- [ ] Check Redis cache hit rate (target >85%)

---

## Files Summary

### Backend (17 files)
```
Create:
- backend/workers/email_sender.py
- backend/routes/auth.py
- backend/routes/notifications.py
- backend/db/repositories/saved_products.py
- backend/tests/test_email_sender.py
- backend/tests/test_auth_flow.py
- backend/tests/test_saved_products.py

Modify:
- backend/db/models.py (add SavedProductModel)
- backend/pipeline/orchestrator.py (add email trigger)
- backend/routes/users.py (update + new endpoints)
- backend/main.py (register new routes)
- backend/services/email_service.py (unsubscribe support)
```

### Frontend (10 files)
```
Create:
- frontend/src/app/[locale]/profile/page.tsx
- frontend/src/app/[locale]/profile/layout.tsx
- frontend/src/components/ProfileSection.tsx
- frontend/src/components/NotificationPreferences.tsx
- frontend/src/components/SavedProductsList.tsx
- frontend/src/components/SaveButton.tsx

Modify:
- frontend/src/app/api/auth/[...nextauth]/route.ts
- frontend/src/components/VerdictCard/index.tsx
- frontend/src/components/home/NavBar.tsx
```

### Database (1 migration)
```
New table: saved_products
New index: idx_saved_products_user_id
```

---

## Success Criteria

Phase 2 is complete when:

- [ ] Email notifications: 90%+ delivery rate (verified in Resend dashboard)
- [ ] User auth: 100+ users created (verified in DB)
- [ ] Saved products: 50%+ of logged-in users have ≥1 saved product
- [ ] Profile page: Loads without errors, all sections display correctly
- [ ] Tests: All 44+ new tests passing + existing 49 tests still passing
- [ ] Security: No hardcoded secrets, XSS prevention, CSRF tokens working
- [ ] Performance: Email sender processes 50 emails in <5 seconds
- [ ] Monitoring: Sentry showing 0 errors in production
- [ ] Deployment: All features live and accessible

---

**Document Version:** 1.0 - Quick-Start  
**Last Updated:** 2026-06-06  
**Use this checklist at the start of each building session**
