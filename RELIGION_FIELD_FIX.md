# Religion Field Fix

## Issue
The religion field was not being saved to the MongoDB database when users updated their profile settings. The dropdown would show "Select religion" but the value wouldn't persist in the database.

## Root Cause
The backend API endpoint at `src/routes/api/student/profile/+server.ts` had a logical issue in how it handled optional fields:

**Before (Line 245):**
```typescript
if (religion) updateData.religion = religion.trim();
```

This condition evaluates to `false` when:
- `religion` is `null`
- `religion` is `undefined`
- `religion` is an empty string `""`

So when the frontend sent `religion: null` (from the dropdown's default "Select religion" value), the backend would skip updating the field entirely.

## Solution
Changed the update logic to explicitly check if the field is provided in the request (`undefined` check), rather than checking if it's truthy:

**After:**
```typescript
if (religion !== undefined) updateData.religion = religion ? religion.trim() : null;
```

Now the logic works as follows:
- If `religion` is not provided in the request → skip updating (field unchanged)
- If `religion` is provided but empty/null → set to `null` (clear the field)
- If `religion` has a value → trim and save it

## Files Changed
- `/Users/maintenance/Documents/HASmakin/src/routes/api/student/profile/+server.ts`
  - Updated the update logic for: `religion`, `department`, `faculty`, `stateOfOrigin`, `dateOfBirth`, `phoneNumber`
  - All optional profile fields now use the same pattern

## Testing
1. **Dev Server**: Restarted and running on http://localhost:5173/
2. **Current State**: 
   - User "Giddel Wilson" (gogbonna004@uniport.edu.ng) exists in database
   - Religion field is currently missing from the user record
3. **Next Steps**: 
   - Navigate to Profile Settings page
   - Select a religion from the dropdown (e.g., "Christianity", "Islam", etc.)
   - Click "Save Changes"
   - Verify religion field is now saved in the database

## Verification Script
To check if the religion was saved after updating:
```bash
bun run check-user.ts
```

This will display the full user record including the religion field.

## Available Religions in Dropdown
The frontend offers these common options:
- Christianity
- Islam
- Traditional Religion
- Other
- Prefer not to say

---
**Fixed on**: October 7, 2025
**Issue reported by**: User (Giddel Wilson)
**Fixed by**: GitHub Copilot
