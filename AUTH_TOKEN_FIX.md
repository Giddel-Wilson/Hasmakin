# Authentication Token Fix

## Problem
Getting "Invalid authentication token" error when trying to submit the application.

## Root Cause
The JWT access token has expired or become invalid. JWT tokens have a limited lifespan (typically 15 minutes to 1 hour).

## Quick Solution: Re-login

The fastest way to fix this is to log out and log back in to get fresh tokens.

### Steps:
1. Open browser at: http://localhost:5173/dashboard
2. Look for the logout button (usually in the header near your profile)
3. Click logout
4. Go to: http://localhost:5173/auth/login
5. Log in with your credentials:
   - **Email:** gogbonna004@uniport.edu.ng
   - **Password:** [your password]

OR you can directly access the logout API:
1. Open: http://localhost:5173/api/auth/logout
2. Then go to: http://localhost:5173/auth/login

## How the Token System Works

### Access Token
- Short-lived (15-60 minutes)
- Stored in cookies as `accessToken`
- Used for API requests
- Expires quickly for security

### Refresh Token
- Long-lived (7-30 days)
- Stored in localStorage as `refreshToken`
- Used to get new access tokens
- Only expires on logout or after long inactivity

### Auto-Refresh Flow
When you make an API request:
1. Frontend sends request with access token
2. If token is expired (401 error)
3. Frontend automatically tries to refresh using refresh token
4. If refresh succeeds, retries the original request
5. If refresh fails, redirects to login

## Why Auto-Refresh Might Fail

1. **Refresh token expired:** You need to log in again
2. **Refresh token missing:** Cleared browser data or never logged in
3. **JWT secret changed:** Server was restarted with different secret
4. **Database connection issue:** Can't verify the refresh token

## Console Logging

The system logs authentication attempts. Check browser console for:
```
Got 401, attempting to refresh tokens...
Attempting to refresh tokens...
Tokens refreshed, retrying original request...
```

Or if it fails:
```
Token refresh failed, but not redirecting automatically
```

## Alternative: Clear Cookies and Re-login

If logout doesn't work, manually clear cookies:
1. Open browser DevTools (F12)
2. Go to Application tab
3. Expand Cookies → http://localhost:5173
4. Delete `accessToken` cookie
5. Go to Local Storage → http://localhost:5173
6. Delete `refreshToken` item
7. Refresh page → should redirect to login

## For Development: Quick Login Script

You can also use the admin bypass (if enabled):
```bash
# Clear rate limiting
curl -X POST http://localhost:5173/api/auth/clear-rate-limit

# Login
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gogbonna004@uniport.edu.ng","password":"your_password"}' \
  -c cookies.txt

# The cookies.txt file now has your fresh tokens
```

## Preventing This Issue

### For Users:
- Stay active (don't leave page idle for too long)
- The system should auto-refresh tokens in the background

### For Developers:
- Increase access token expiration time
- Add visual indicator for token expiration
- Implement proper token refresh UI feedback
- Add "session about to expire" warning

## Current Token Settings

Check your JWT configuration in:
- Environment variables: `JWT_SECRET`, `JWT_EXPIRES_IN`
- Default expiration: 15 minutes (access token)
- Refresh token: 7 days

## Troubleshooting

If re-login doesn't work:

1. **Check if auth service is running:**
   ```bash
   curl http://localhost:5173/api/auth/login
   # Should get: Method not allowed or login form
   ```

2. **Check database connection:**
   - Auth requires database to verify credentials

3. **Check JWT secret:**
   - Server needs consistent JWT_SECRET
   - Check .env file

4. **Clear all browser data:**
   - Complete browser cache/cookie clear
   - Try incognito mode

## After Re-login

Once you have fresh tokens:
1. Go back to application form
2. Your form data should still be there (if you didn't refresh)
3. Submit the application again
4. Should work now! ✅
