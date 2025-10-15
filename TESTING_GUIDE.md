# Quick Start Guide - Testing the Fixed Application Submission

## What Was Fixed

The "Authentication error. Please try again." issue has been resolved. The backend has been completely rebuilt with:

✅ Proper JWT authentication
✅ Comprehensive validation
✅ Clear error messages
✅ Detailed logging
✅ Type-safe code

## How to Test

### Option 1: Automated Backend Test

Run the test script to verify backend functionality:

```bash
bun run test-application-submission.ts
```

This will verify:
- Database connectivity
- Token generation/verification
- Hostel availability
- Validation logic

### Option 2: Manual Web Testing

1. **Start the development server** (if not already running):
   ```bash
   bun run dev
   ```

2. **Open your browser** to: http://localhost:5173

3. **Log in as a student**:
   - Test student from our test: `gogbonna004@uniport.edu.ng`
   - Or any active student account

4. **Navigate to** "Apply for Hostel" in the dashboard

5. **Fill out the form**:
   - Select hostel gender preference
   - Choose at least one hostel
   - Optionally add special needs
   - Check the declaration box
   - Click "Submit Application"

6. **Expected Results**:
   - ✅ Success message appears
   - ✅ Redirect to dashboard after 2 seconds
   - ✅ Application shows as "Pending" on dashboard

## Debugging

### Check Browser Console

Open browser DevTools (F12) and look for:

```
[Frontend] Submitting application: { ... }
[Frontend] Response status: 201
[Frontend] Application submitted successfully: { ... }
```

### Check Server Logs

In your terminal running the dev server, look for:

```
[Application] Authenticated user: { userId: '...', role: 'STUDENT' }
[Application] Received application data: { ... }
[Application] Validation passed
[Application] Created application: { ... }
[Application] Successfully submitted application: <id>
```

## Common Issues & Solutions

### "Authentication required. Please log in again."
- **Cause**: Session expired or invalid token
- **Solution**: Log out and log back in

### "You already have an active hostel application."
- **Cause**: Student already has a PENDING/APPROVED/ALLOCATED application
- **Solution**: Either test with a different student, or delete/reject the existing application

### "No valid hostels found for your preferences."
- **Cause**: Selected hostels don't match gender preference or are full
- **Solution**: 
  1. Check hostels are active: `isActive = true`
  2. Check hostels have space: `available > 0`
  3. Ensure gender matches

### Network errors
- **Cause**: Server not running or connection issues
- **Solution**: 
  1. Restart dev server: `bun run dev`
  2. Check database connection
  3. Verify environment variables

## Important Files

### Backend
- `/src/routes/api/applications/+server.ts` - Main application submission API
- `/src/hooks.server.ts` - Authentication middleware
- `/src/lib/server/auth.ts` - JWT token utilities

### Frontend
- `/src/routes/dashboard/apply/+page.svelte` - Application form

### Testing
- `/test-application-submission.ts` - Backend test script
- `/APPLICATION_SUBMISSION_REBUILD.md` - Full documentation

## What to Watch For

1. **Console Logs**: Both browser and server logs are detailed
2. **Error Messages**: Now specific and actionable
3. **Token Expiration**: Access tokens expire in 15 minutes (this is normal)
4. **Auto-Refresh**: ClientAuth automatically tries to refresh expired tokens

## Success Indicators

✅ Form submits without errors
✅ Success message displays
✅ Redirects to dashboard
✅ Application appears in student's dashboard
✅ Application status is "PENDING"
✅ Audit log created in database

## Need Help?

Check the detailed logs in:
- Browser console (F12)
- Server terminal output
- Application submission rebuild doc: `APPLICATION_SUBMISSION_REBUILD.md`

All authentication and validation steps are logged with `[Application]` prefix for easy filtering.
