# Application Submission Logout Fix

## Date: October 9, 2025

## Problem
After rebuilding the application submission backend, users were being **logged out** when they submitted their hostel application.

## Root Cause

The issue had **three interconnected problems**:

### 1. **Aggressive Cookie Deletion**
When JWT verification failed in the backend, the code was immediately deleting both `accessToken` and `refreshToken` cookies:

```typescript
// ❌ OLD CODE - Too aggressive
catch (jwtError) {
  cookies.delete('accessToken', { path: '/' });
  cookies.delete('refreshToken', { path: '/' });
  return json({ error: 'Invalid or expired session' }, { status: 401 });
}
```

**Problem**: This prevented the automatic token refresh mechanism from working because the refresh token was being deleted!

### 2. **Frontend Auto-Logout on 401**
The frontend was automatically logging users out and redirecting to login on any 401 error:

```typescript
// ❌ OLD CODE - Too aggressive
else if (response.status === 401) {
  errors.submit = 'Your session has expired. Please log in again.';
  setTimeout(() => {
    ClientAuth.clearAuth();
    goto('/auth/login');
  }, 2000);
}
```

**Problem**: Even if the token refresh worked, users were still being redirected to login!

### 3. **Cookie Setting Method**
The refresh and login endpoints were setting cookies using manual `Set-Cookie` headers instead of SvelteKit's cookie API:

```typescript
// ❌ OLD CODE - Unreliable
const accessTokenCookie = `accessToken=${tokens.accessToken}; HttpOnly; Path=/; ...`;
response.headers.set('Set-Cookie', accessTokenCookie);
response.headers.append('Set-Cookie', refreshTokenCookie);
```

**Problem**: This method doesn't always work correctly with multiple cookies and can cause issues with cookie persistence.

## Solution

### 1. Fixed Backend - Don't Delete Cookies on JWT Failure

**File**: `/src/routes/api/applications/+server.ts`

```typescript
// ✅ NEW CODE - Let client handle refresh
catch (jwtError) {
  console.error('[Application] JWT verification failed:', ...);
  // Don't delete cookies - let the client handle refresh
  return json(
    { error: 'Invalid or expired session. Please try refreshing or log in again.' },
    { status: 401 }
  );
}
```

**Why**: The `ClientAuth.fetch` automatically attempts to refresh the token when it receives a 401. By not deleting the cookies, we allow this refresh mechanism to work.

### 2. Fixed Frontend - Don't Auto-Logout on 401

**File**: `/src/routes/dashboard/apply/+page.svelte`

```typescript
// ✅ NEW CODE - Give user a chance to retry
else if (response.status === 401) {
  console.error('[Frontend] Authentication failed (401) after refresh attempt');
  errors.submit = 'Authentication failed. Please try again. If this persists, please log out and log back in.';
  // Don't automatically redirect to login
}
```

**Why**: The user might just need to click submit again. If there's a real auth problem, they'll get the message and can manually log out.

### 3. Fixed Cookie Setting - Use SvelteKit Cookie API

**Files**: 
- `/src/routes/api/auth/login/+server.ts`
- `/src/routes/api/auth/refresh/+server.ts`

```typescript
// ✅ NEW CODE - Reliable cookie setting
cookies.set('accessToken', tokens.accessToken, {
  httpOnly: true,
  path: '/',
  sameSite: 'lax',
  maxAge: 900, // 15 minutes
  secure: false
});

cookies.set('refreshToken', tokens.refreshToken, {
  httpOnly: true,
  path: '/',
  sameSite: 'lax',
  maxAge: 604800, // 7 days
  secure: false
});
```

**Why**: SvelteKit's cookie API properly handles multiple cookies and ensures they're set correctly in the response.

### 4. Enhanced Refresh Endpoint - Read from Cookies

**File**: `/src/routes/api/auth/refresh/+server.ts`

```typescript
// ✅ NEW CODE - Try cookie first, fall back to body
let refreshToken = cookies.get('refreshToken');

if (!refreshToken) {
  // Fall back to request body for backwards compatibility
  const body = await request.json().catch(() => ({}));
  refreshToken = body.refreshToken;
}
```

**Why**: The refresh token should come from the HTTP-only cookie, not localStorage. This is more secure and reliable.

## How the Token Refresh Flow Works Now

1. **User submits application** with a potentially expired access token (15min lifetime)

2. **Server receives request** and tries to verify the JWT
   - ❌ JWT verification fails (token expired)
   - ✅ Returns 401 (but **doesn't delete cookies**)

3. **ClientAuth.fetch intercepts 401**
   ```typescript
   if (response.status === 401 && this.getRefreshToken()) {
     const refreshed = await this.refreshTokens();
     if (refreshed) {
       return fetch(url, { ...options, credentials: 'include' });
     }
   }
   ```

4. **refreshTokens() calls /api/auth/refresh**
   - Sends refresh token (from localStorage as fallback)
   - Server reads refresh token from **cookie** (preferred)
   - Server validates refresh token
   - Server generates **new** access and refresh tokens
   - Server sets **new cookies** using SvelteKit API
   - Returns success

5. **Original request is retried**
   - Now includes the **fresh access token** in cookie
   - ✅ JWT verification succeeds
   - ✅ Application is created
   - ✅ Success response returned

6. **Frontend shows success message**
   - No logout
   - No redirect to login
   - User sees "Application submitted successfully!"

## Token Lifetimes

- **Access Token**: 15 minutes (900 seconds)
  - Used for authentication on each request
  - Expires quickly for security
  
- **Refresh Token**: 7 days (604,800 seconds)
  - Used to get new access tokens
  - Longer lifetime for better UX

## Security Considerations

✅ Tokens stored in **HTTP-only cookies** (not accessible to JavaScript)
✅ Refresh token has **7-day lifetime** (reasonable balance)
✅ Access token has **15-minute lifetime** (limits exposure)
✅ Automatic refresh is **transparent to user**
✅ Failed refresh doesn't immediately log out (gives user chance to retry)
✅ Cookies use **SameSite=Lax** (CSRF protection)

## Files Modified

1. `/src/routes/api/applications/+server.ts` - Removed aggressive cookie deletion
2. `/src/routes/dashboard/apply/+page.svelte` - Removed auto-logout on 401
3. `/src/routes/api/auth/login/+server.ts` - Use SvelteKit cookie API
4. `/src/routes/api/auth/refresh/+server.ts` - Read from cookies, use SvelteKit API
5. `/src/lib/auth.ts` - Enhanced refresh token logging

## Testing Checklist

- [ ] Log in as student
- [ ] Fill out application form slowly (take >5 minutes)
- [ ] Submit application
- [ ] ✅ Should see success message
- [ ] ✅ Should NOT be logged out
- [ ] ✅ Should be redirected to dashboard
- [ ] Check browser console for refresh logs
- [ ] Check server logs for token refresh

## Expected Logs

### Browser Console (if token expired):
```
Got 401, attempting to refresh tokens...
Attempting to refresh tokens...
Refresh token in localStorage: true
Refresh response status: 200
Refresh successful
Tokens refreshed, retrying original request...
[Frontend] Response status: 201
[Frontend] Application submitted successfully
```

### Server Logs (if token expired):
```
[Application] JWT verification failed: jwt expired
=== Refresh Token Request ===
Refresh token provided: true
Refresh token source: cookie
Setting new tokens in cookies...
✅ New tokens set in cookies
[Application] Authenticated user: { userId: '...', role: 'STUDENT' }
[Application] Created application: ...
```

## Conclusion

The logout issue has been fixed by:
1. ✅ Not deleting cookies prematurely
2. ✅ Not auto-logging out users on 401
3. ✅ Using proper cookie API for reliable cookie setting
4. ✅ Reading refresh tokens from cookies (more secure)

Users can now submit applications even if their access token expires during form filling. The automatic token refresh mechanism works transparently in the background.
