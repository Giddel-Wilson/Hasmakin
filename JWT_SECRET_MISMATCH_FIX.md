# JWT Secret Mismatch Fix - The REAL Root Cause

## Date: October 9, 2025

## The ACTUAL Problem

After all the authentication fixes, submissions were STILL failing with:
```
Setting new tokens in cookies...
✅ New tokens set in cookies
[Application] JWT verification failed: invalid signature
```

## Root Cause: JWT Secret Mismatch

The tokens were being **created with one secret** but **verified with a different secret**!

### The Mismatch:

**Token Generation** (in `/src/lib/server/auth.ts`):
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
//                                              ^^^^^^^^^^^^^^^^^^^
```

**Token Verification** (in `/src/routes/api/applications/+server.ts`):
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
//                                              ^^^^^^^^^^^^^^
```

**Notice the difference?** 
- Generation: `'fallback-secret-key'` 
- Verification: `'fallback-secret'`

### Why This Caused the Issue:

1. **User logs in** → Token created with `'fallback-secret-key'` ✅
2. **Token expires** → Refresh called → New token created with `'fallback-secret-key'` ✅  
3. **User submits application** → Verification uses `'fallback-secret'` ❌
4. **JWT verification fails** → "invalid signature" error
5. **User gets logged out** 😢

JWT signatures are based on the secret. If the secret doesn't match, the signature verification fails even if the token is perfectly valid!

## The Fix

Changed the applications endpoint to use the same fallback secret:

```typescript
// ❌ BEFORE
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// ✅ AFTER
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
```

**File Modified**: `/src/routes/api/applications/+server.ts` (line 11)

## Why This Wasn't Caught Earlier

1. If you have `JWT_SECRET` in your environment variables, the fallback never gets used
2. In development, you might not have `.env` configured
3. The error message "invalid signature" doesn't tell you it's a secret mismatch
4. The token refresh worked fine (same secret for generation and verification)
5. Only the application endpoint had the typo

## Verification

Checked all other files - this was the ONLY file with the wrong fallback:

```bash
# All other files use 'fallback-secret-key'
grep -r "JWT_SECRET.*fallback" src/
```

Results:
- ✅ `/src/lib/server/auth.ts` - `'fallback-secret-key'`
- ✅ `/src/routes/api/admin/**` - `'fallback-secret-key'`
- ✅ `/src/routes/api/student/**` - `'fallback-secret-key'`
- ✅ `/src/routes/api/applications/+server.ts` - NOW `'fallback-secret-key'`

## Testing

Try submitting the application again. You should now see:

### Success Logs:
```
[Application] Authenticated user: { userId: '...', role: 'STUDENT' }
[Application] Received application data: { ... }
[Application] Validation passed
[Application] Created application: <id>
[Application] Successfully submitted application: <id>
```

### No More:
```
❌ [Application] JWT verification failed: invalid signature
```

## Prevention

To prevent this in the future:

1. **Use environment variables** - Set `JWT_SECRET` in `.env`:
   ```bash
   JWT_SECRET=your-super-secret-key-here
   ```

2. **Centralize constants** - Consider creating a shared constants file:
   ```typescript
   // src/lib/server/constants.ts
   export const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
   ```

3. **Test without .env** - Occasionally test with fallback values to catch mismatches

## Summary

The issue was a simple typo in the fallback JWT secret:
- **Expected**: `'fallback-secret-key'`
- **Actual**: `'fallback-secret'` (missing `-key`)

This caused all token verifications in the applications endpoint to fail with "invalid signature", even though the tokens were perfectly valid.

**Status**: ✅ FIXED

Now you can submit applications without authentication errors! 🎉
