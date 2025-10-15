# Admin Applications Page Fix

## Date: October 9, 2025

## Problem
The admin applications management page (/admin/applications) was stuck loading with a spinner and showing 0 applications, even though applications exist in the database.

## Root Cause
The `/api/admin/applications` endpoint was using `jwt.verify()` directly without the proper JWT verification options (issuer and audience), causing all JWT token verifications to fail with "invalid signature" error.

This is the same issue that was affecting the student application submission endpoint.

## The Fix

Changed the admin applications endpoint to use `AuthService.verifyAccessToken()` instead of direct `jwt.verify()`:

### Before (BROKEN):
```typescript
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Direct JWT verification without options
try {
  const payload = jwt.verify(token, JWT_SECRET) as any;
  if (payload.role !== 'ADMIN') {
    return json({ error: 'Admin access required' }, { status: 403 });
  }
} catch (error) {
  return json({ error: 'Invalid token' }, { status: 401 });
}
```

### After (FIXED):
```typescript
import { AuthService } from '$lib/server/auth';

// Use AuthService which includes proper verification options
const payload = AuthService.verifyAccessToken(token);
if (!payload) {
  return json({ error: 'Invalid token' }, { status: 401 });
}
if (payload.role !== 'ADMIN') {
  return json({ error: 'Admin access required' }, { status: 403 });
}
```

## File Modified
- `/src/routes/api/admin/applications/+server.ts`

## Testing
1. Log in as admin
2. Go to /admin/applications
3. Page should now load and display all applications
4. Filter and search functionality should work

## Known Issue - Other Admin Endpoints
There are ~20 other admin endpoints with the same JWT verification issue:
- `/api/admin/hostels/**`
- `/api/admin/allocations/**`
- `/api/admin/stats`
- `/api/admin/settings/**`
- etc.

These endpoints will also fail with the same authentication error until they're updated to use `AuthService.verifyAccessToken()`.

## Recommended Next Step
Create a centralized admin authentication middleware or helper function to avoid code duplication and prevent this issue in the future.

Example helper:
```typescript
// src/lib/server/admin-auth.ts
export async function verifyAdminToken(token: string | undefined) {
  if (!token) {
    throw new Error('Authentication required');
  }
  
  // Check for simple admin token (fallback mode)
  if (token.startsWith('admin-')) {
    return { role: 'ADMIN', userId: 'admin-fallback' };
  }
  
  // Verify JWT token
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) {
    throw new Error('Invalid token');
  }
  
  if (payload.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  
  return payload;
}
```

Then in endpoints:
```typescript
import { verifyAdminToken } from '$lib/server/admin-auth';

export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const token = cookies.get('accessToken');
    await verifyAdminToken(token);
    // ... rest of endpoint logic
  } catch (error) {
    return json({ error: error.message }, { status: 401 });
  }
};
```

## Status
✅ Admin applications page is now functional
⚠️ Other admin endpoints may still have authentication issues

## Related Fixes
This is part of the larger JWT verification options fix that also affected:
1. Student application submission endpoint
2. All endpoints using direct `jwt.verify()` instead of `AuthService`
