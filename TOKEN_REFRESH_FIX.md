# Application Submission Token Expiration Fix

## Problem
Student application submission fails with error: **"Invalid authentication token"**

## Root Cause
JWT access token has expired after 15-60 minutes of inactivity.

## Solution
Added automatic token refresh and retry logic to the application submission:

### What Changed
**File:** `/src/routes/dashboard/apply/+page.svelte`

Now when submission gets a 401 error:
1. ✅ Automatically attempts to refresh the token
2. ✅ Retries the submission if refresh succeeds
3. ✅ Shows clear error message if refresh fails
4. ✅ Redirects to login page after 2 seconds

### Code Logic
```typescript
if (response.status === 401) {
  // Try to refresh tokens
  const refreshed = await ClientAuth.refreshTokens();
  if (refreshed) {
    // Retry submission
    return submitApplication();
  } else {
    // Show error and redirect to login
    errors.submit = 'Your session has expired. Please log in again.';
    setTimeout(() => goto('/auth/login'), 2000);
  }
}
```

## For the Current Student

**To fix the error you're seeing right now:**

### Option 1: Just Refresh the Page
1. Press `Cmd + R` (Mac) or `Ctrl + R` (Windows)
2. Try submitting the application again
3. Should work now!

### Option 2: Log Out & Log In Again
1. Click "Logout" in the top right
2. Log in with your credentials
3. Go back to the application form
4. Submit your application

## Result
✅ Students can now submit applications even if their session has expired  
✅ Automatic token refresh happens behind the scenes  
✅ Clear error messages if refresh fails  
✅ Seamless user experience  

The application will now handle expired tokens gracefully! 🎉
