# NextAuth.js Setup Guide - Phase 2.1

## Overview
This guide walks through setting up Google OAuth authentication for TrustLens using NextAuth.js v5.

## Prerequisites
- Node.js 18+ with npm/yarn
- Google OAuth credentials (OAuth 2.0)
- Frontend running on `http://localhost:3000`

---

## Step 1: Install Dependencies

```bash
cd frontend
npm install next-auth@latest
```

## Step 2: Create OAuth Credentials

### 2.1 Google Cloud Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "TrustLens"
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth Client ID"
5. Choose "Web application"
6. Authorized JavaScript origins:
   ```
   http://localhost:3000
   http://localhost:3000/en
   http://localhost:3000/in
   ```
7. Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
8. Copy `Client ID` and `Client Secret`

## Step 3: Environment Variables

Create `.env.local` in frontend root:

```bash
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Generate secret with:
# openssl rand -base64 32

GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

## Step 4: Add SessionProvider to Root Layout

Update `frontend/src/app/layout.tsx`:

```typescript
import Providers from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

## Step 5: Update Navigation to Show Auth State

Create `frontend/src/components/Navigation.tsx`:

```typescript
'use client'

import { useSession, signOut } from 'next-auth/react'
import LoginButton from './LoginButton'
import UserMenu from './UserMenu'

export default function Navigation() {
  const { data: session, status } = useSession()

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-white border-b">
      <div>Logo</div>
      <div>
        {status === 'loading' && <span>Loading...</span>}
        {status === 'unauthenticated' && <LoginButton />}
        {status === 'authenticated' && session?.user && (
          <UserMenu
            user={{
              email: session.user.email!,
              name: session.user.name,
              avatarUrl: session.user.image,
            }}
            onLogout={() => signOut()}
          />
        )}
      </div>
    </nav>
  )
}
```

## Step 6: Protect API Endpoints (Backend)

Create `backend/middleware/auth.py`:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
import jwt

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthCredentials = Depends(security)):
    """Verify JWT token from NextAuth.js session"""
    try:
        # In production, verify signature with NEXTAUTH_SECRET
        payload = jwt.decode(
            credentials.credentials,
            options={"verify_signature": False}  # For dev only!
        )
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
```

Update `backend/routes/users.py` to use auth:

```python
from backend.middleware.auth import verify_token

@router.get("/me")
async def get_current_user(
    payload = Depends(verify_token),
    db=None,
):
    """Get authenticated user profile"""
    # payload contains user info from NextAuth JWT
    user_email = payload.get('email')
    ...
```

## Step 7: Test OAuth Flow

### 7.1 Start Frontend
```bash
cd frontend
npm run dev
```

### 7.2 Test Login
1. Click "Sign in with Google"
2. Should redirect to `/auth/signin`
3. Click "Sign in with Google" button
4. Google OAuth popup appears
5. After approval, redirects back to homepage
6. User menu shows email + avatar

### 7.3 Test Protected Route
1. Sign in
2. Visit `/in/preferences`
3. Should show preferences page (requires auth)

### 7.4 Test API Call
```bash
curl -X GET http://localhost:3000/api/auth/session
# Should return session data
```

## Step 8: Connect Backend User Creation

When user signs in via Google, create user in backend:

Update `frontend/src/app/api/auth/[...nextauth]/route.ts`:

```typescript
async signIn({ user, account }) {
  // Call backend to create/get user
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        name: user.name,
        google_id: user.id,
        avatar_url: user.image,
      }),
    }
  )

  return response.ok
}
```

## Step 9: Session Persistence

NextAuth stores sessions in JWT by default. For database sessions:

### Option A: Database Sessions (Recommended)
Install adapter:
```bash
npm install @next-auth/prisma-adapter
```

### Option B: JWT (Current Setup)
Sessions are stateless, no database needed.

## Testing Checklist

- [ ] Login button redirects to `/auth/signin`
- [ ] Google OAuth flow works
- [ ] Session persists after refresh
- [ ] User menu shows signed-in user
- [ ] Sign out clears session
- [ ] Protected pages require auth
- [ ] Backend API rejects unauthenticated requests
- [ ] Preferences page only accessible when signed in
- [ ] Saved searches per user
- [ ] Email notifications scoped to user

## Production Checklist

Before deploying:

1. **Environment Variables**
   - [ ] NEXTAUTH_SECRET in production
   - [ ] GOOGLE_CLIENT_ID and SECRET from production OAuth app
   - [ ] NEXTAUTH_URL set to production domain

2. **Security**
   - [ ] HTTPS enabled
   - [ ] CSRF protection enabled (default)
   - [ ] Secure cookies (default in production)
   - [ ] CORS configured correctly

3. **Database**
   - [ ] Users table created
   - [ ] Indexes on email, google_id
   - [ ] Migrations run

4. **Monitoring**
   - [ ] Login errors logged to Sentry
   - [ ] Session timeouts configured
   - [ ] Token refresh working

5. **Testing**
   - [ ] OAuth flow tested
   - [ ] Session persistence verified
   - [ ] Protected routes working
   - [ ] Logout works

## Troubleshooting

### Issue: "OAuth 2.0 error: invalid_client"
**Solution**: Check Google Client ID and Secret are correct

### Issue: Redirect URI mismatch
**Solution**: Add `http://localhost:3000/api/auth/callback/google` in Google Console

### Issue: Session not persisting
**Solution**: Check NEXTAUTH_SECRET is set and consistent

### Issue: "Invalid NEXTAUTH_URL" error
**Solution**: Make sure NEXTAUTH_URL matches current domain

### Issue: CORS errors when calling backend
**Solution**: Add frontend URL to backend ALLOWED_ORIGINS

## Further Reading

- [NextAuth.js Documentation](https://next-auth.js.org)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [JWT Sessions](https://next-auth.js.org/configuration/options#session)

---

**Status**: ✅ Ready for Phase 2.1 Implementation
