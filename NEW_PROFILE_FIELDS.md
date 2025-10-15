# New Profile Fields Added - Gender & Guardian Phone

## Overview
Added two critical fields to the student profile system:
1. **Gender** (Required) - Essential for gender-specific hostel allocation
2. **Guardian Phone Number** (Optional) - Emergency contact information

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)
Added two new fields to the User model:
```prisma
gender        Gender?       // Student's gender (for hostel allocation)
guardianPhone String?       @map("guardian_phone") // Guardian/parent phone number
```

The `Gender` enum was already defined in the schema:
```prisma
enum Gender {
  MALE
  FEMALE
  MIXED
}
```

### 2. Backend API (`src/routes/api/student/profile/+server.ts`)

**GET Endpoint:**
- Added `gender` and `guardianPhone` to the response fields

**PUT Endpoint:**
- Added `gender` and `guardianPhone` to request body destructuring
- Added validation for guardian phone (same format as regular phone)
- Added validation for gender (must be MALE or FEMALE)
- Updated the update data preparation to handle both fields

**Validation Rules:**
```typescript
// Gender validation
if (gender && !['MALE', 'FEMALE'].includes(gender)) {
  errors.push('Gender must be either MALE or FEMALE');
}

// Guardian phone validation
if (guardianPhone && (typeof guardianPhone !== 'string' || !/^\+?[\d\s-()]{10,15}$/.test(guardianPhone))) {
  errors.push('Please provide a valid guardian phone number');
}
```

### 3. Frontend UI (`src/routes/dashboard/settings/+page.svelte`)

**Interface Updates:**
- Added `gender` and `guardianPhone` to `UserProfile` interface
- Added both fields to `formData` object

**Form UI:**
- **Gender Field**: Dropdown with Male/Female options (marked as required with red asterisk)
- **Guardian Phone Field**: Tel input with phone number formatting

**Form Layout:**
```
Personal Details Row:
- Gender (dropdown) | Religion (dropdown)

Contact Information Rows:
Row 1: Phone Number | Guardian Phone Number
Row 2: Date of Birth | (empty)
```

**Phone Formatting:**
Both phone fields use the same formatting function to ensure consistent format: `+234 xxx xxx xxxx`

## Files Modified
1. `/Users/maintenance/Documents/HASmakin/prisma/schema.prisma`
2. `/Users/maintenance/Documents/HASmakin/src/routes/api/student/profile/+server.ts`
3. `/Users/maintenance/Documents/HASmakin/src/routes/dashboard/settings/+page.svelte`

## Database State
After running migrations and testing:
- ✅ Prisma client regenerated
- ✅ Schema pushed to MongoDB
- ✅ Fields verified in database inspection
- ✅ Test data added successfully

**Sample User Record:**
```json
{
  "name": "Giddel Wilson",
  "email": "gogbonna004@uniport.edu.ng",
  "gender": "MALE",
  "religion": "Christianity",
  "phone_number": "+2348061403424",
  "guardian_phone": "+2348012345678",
  "department": "Computer Science",
  "faculty": "Faculty of Computing"
}
```

## Why These Fields Matter

### Gender Field
- **Critical for Hostel Allocation**: Hostels are gender-specific (Male, Female, or Mixed)
- **Required Field**: Users should select their gender during profile setup
- **Validates Allocation Logic**: Ensures students are only assigned to appropriate hostels

### Guardian Phone Number
- **Emergency Contact**: Provides alternative contact in case student is unreachable
- **Administrative Use**: Useful for important notifications about allocations
- **Optional Field**: Not mandatory but recommended for safety

## Testing
1. **Dev Server**: Running on http://localhost:5173/
2. **Database Verification**: 
   ```bash
   bun run inspect-database.ts
   ```
   Shows both `gender` and `guardian_phone` columns in users collection

3. **Manual Testing Steps**:
   - Navigate to Profile Settings
   - Select gender from dropdown
   - Enter guardian phone number
   - Click "Save Changes"
   - Verify data persists in database

## UI Preview
The form now shows:
- Gender dropdown (Male/Female) - marked as required (*)
- Guardian Phone input field with placeholder "+234 xxx xxx xxxx"
- Both fields properly integrated into the existing form layout

## MongoDB Columns
New columns visible in users collection:
- `gender` - Stores "MALE" or "FEMALE" or null
- `guardian_phone` - Stores formatted phone number or null

---
**Added on**: October 8, 2025  
**Requested by**: User  
**Implemented by**: GitHub Copilot  
**Status**: ✅ Complete and Tested
