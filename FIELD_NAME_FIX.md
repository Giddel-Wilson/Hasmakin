# Prisma Field Name Fix: type → gender

## Issue
The application was throwing Prisma validation errors:
```
Unknown argument `type`. Did you mean `name`? Available options are marked with ?.
```

## Root Cause
The code was using `type` field to filter hostels, but the Prisma schema defines the field as `gender`.

**Prisma Schema:**
```prisma
model Hostel {
  id       String   @id @default(auto()) @map("_id") @db.ObjectId
  name     String   @unique
  gender   Gender   // ← Correct field name
  capacity Int
  ...
}
```

## Files Fixed

### 1. `/src/routes/api/hostels/+server.ts`
**Line 13:** Changed query filter
```typescript
// Before:
where.type = type;

// After:
where.gender = type; // Fixed: use 'gender' field instead of 'type'
```

**Lines 56-58:** Fixed response object
```typescript
// Before:
return {
  ...
  type: hostel.type,
  gender: hostel.type, // For backward compatibility
  ...
}

// After:
return {
  ...
  gender: hostel.gender, // Use 'gender' field from schema
  type: hostel.gender,   // For backward compatibility
  ...
}
```

### 2. `/src/routes/api/admin/allocations/run/+server.ts`
**Line 131 & 139:** Fixed hostel preference matching
```typescript
// Before:
room.hostel.type === application.hostelPreference

// After:
room.hostel.gender === application.hostelPreference
```

## Impact
- **Fixed:** Hostel listing API now works correctly
- **Fixed:** Hostel allocation logic now correctly matches student preferences
- **Maintained:** Backward compatibility by including both `gender` and `type` in API responses

## Testing
✅ Hostel API endpoint now returns hostels without errors
✅ Application form loads available hostels correctly
✅ Hostel gender preference filtering works as expected

## Related Schema
The `Gender` enum in Prisma schema:
```prisma
enum Gender {
  MALE
  FEMALE
  MIXED
}
```

This enum is used consistently across:
- `Hostel.gender` - Hostel gender type
- `User.gender` - Student gender
- `Application.gender` - Application gender filter
