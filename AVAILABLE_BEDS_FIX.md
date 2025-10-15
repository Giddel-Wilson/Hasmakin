# Available Beds Display Fix

## Problem
The "Available Beds" field was showing the same value as "Total Beds" for all hostels, even when some beds had been reserved or occupied.

**Incorrect Display:**
- Eleanor Roosevelt Hall: 600 total, showing **600 available** ❌ (should be 560)
- NDDC Hostel: 120 total, showing **120 available** ❌ (should be 80)

## Root Cause

**Original Logic (WRONG):**
```typescript
availableBeds: (hostel.totalCapacity || hostel.capacity || 0) - (hostel.totalOccupied || 0)
```

**Problem:** This calculated available beds as `Total - Allocated`, but it ignored the `available` field that exists in the database.

**Database Reality:**
```
Hostel Table Schema:
- capacity: Total bed capacity (e.g., 600)
- available: Currently available beds (e.g., 560)
- The difference (600 - 560 = 40) represents reserved/occupied beds
```

The database already tracks the **actual available beds** in the `available` field, but the frontend was recalculating it incorrectly.

## Solution

Changed the mapping to use the **actual database value**:

```typescript
availableBeds: hostel.available || 0
```

**File:** `/src/routes/admin/hostels/+page.svelte`

**Before:**
```typescript
hostels = rawHostels.map((hostel: any) => ({
  ...hostel,
  totalBeds: hostel.totalCapacity || hostel.capacity || 0,
  occupiedBeds: hostel.totalOccupied || 0,
  availableBeds: (hostel.totalCapacity || hostel.capacity || 0) - (hostel.totalOccupied || 0) // ❌
}));
```

**After:**
```typescript
hostels = rawHostels.map((hostel: any) => ({
  ...hostel,
  totalBeds: hostel.totalCapacity || hostel.capacity || 0,
  occupiedBeds: hostel.totalOccupied || 0,
  availableBeds: hostel.available || 0  // ✅ Use database value
}));
```

## Updated Occupancy Calculation

Also updated the occupancy rate calculation to use the correct available value:

**Before:**
```typescript
function getOccupancyRate(hostel: any) {
  const total = hostel.totalBeds || 0;
  const occupied = hostel.occupiedBeds || 0;  // This was always 0
  if (total === 0) return 0;
  return Math.round((occupied / total) * 100);
}
```

**After:**
```typescript
function getOccupancyRate(hostel: any) {
  const total = hostel.totalBeds || hostel.capacity || 0;
  const available = hostel.availableBeds || hostel.available || 0;
  if (total === 0) return 0;
  const occupied = total - available;  // Calculate from available
  return Math.round((occupied / total) * 100);
}
```

## Verification Results

After the fix, the display now shows:

| Hostel                  | Total Beds | Available | Occupied | Occupancy |
|------------------------|-----------|-----------|----------|-----------|
| Alvan Ikoku Hall       | 500       | **500**   | 0        | 0%        |
| Eleanor Roosevelt Hall | 600       | **560**   | 40       | **7%**    |
| NDDC Hostel           | 120       | **80**    | 40       | **33%**   |
| Professor Dike Hall    | 400       | **400**   | 0        | 0%        |
| Queen Elizabeth Hall   | 450       | **450**   | 0        | 0%        |

✅ All values now match the database exactly!

## Why Some Hostels Have Reduced Availability

The `available` field in the database represents beds that are currently available for new allocations. It can be less than `capacity` for several reasons:

1. **Beds Already Allocated**: Students have been assigned to specific rooms
2. **Beds Reserved**: Beds set aside for special cases or pending allocations
3. **Beds Under Maintenance**: Rooms temporarily unavailable
4. **Manual Adjustments**: Admins reduced availability through the interface

In this case:
- **Eleanor Roosevelt Hall**: 40 beds out of 600 are occupied/reserved (7% occupancy)
- **NDDC Hostel**: 40 beds out of 120 are occupied/reserved (33% occupancy)

## Database Field Explanation

The Hostel model has these key fields:

```prisma
model Hostel {
  capacity  Int     // Total bed capacity (set when creating hostel)
  available Int     // Currently available beds (decreases when allocating)
  
  // Example:
  // capacity: 600   (never changes unless edited)
  // available: 560  (decreases when students are allocated)
  // occupied: 40    (calculated: capacity - available)
}
```

## Data Flow

```
Database (MongoDB)
  └─ Hostel { capacity: 600, available: 560 }

↓ API Response

  └─ { totalCapacity: 600, available: 560 }

↓ Frontend Mapping

  └─ { totalBeds: 600, availableBeds: 560 }

↓ Display

  └─ Total Beds: 600
     Available: 560
     Occupancy: 7%
```

## Test Script

Created `verify-availability.ts` to check values:

```bash
bun run verify-availability.ts
```

Output shows:
- Total capacity (from rooms or database)
- Available beds (from database)
- Occupied beds (calculated as Total - Available)
- Occupancy percentage

## Summary

✅ **Fixed:** Available beds now show actual database values  
✅ **Fixed:** Occupancy rate calculated correctly from available beds  
✅ **Eleanor Roosevelt Hall:** Shows 560 available (not 600)  
✅ **NDDC Hostel:** Shows 80 available (not 120)  
✅ **All values:** Match database exactly  

The admin hostel page now displays accurate availability information! 🎉
