# Payment Activity Log Error Fix

## Issue
When rejecting or confirming payments, the API threw this error:
```
TypeError: Cannot read properties of undefined (reading 'create')
```

## Root Cause
The API endpoints were trying to create records in `prisma.activityLog` and `prisma.auditLog` tables that don't exist in the database schema.

## Error Locations
1. `/api/admin/payments/[id]/reject` - Line 62: `prisma.activityLog.create()`
2. `/api/admin/payments/[id]/confirm` - Line 75: `prisma.auditLog.create()`

## Solution
Replaced database logging with console logging for now. The rejection/confirmation actions are still tracked through:
- Payment status updates in the database
- Gateway response JSON metadata
- Console logs for debugging
- Updated payment timestamps

## Changes Made

### 1. Reject Endpoint
**Before:**
```typescript
await prisma.activityLog.create({
  data: {
    userId: locals.user?.id || 'system',
    action: 'PAYMENT_REJECTED',
    details: `Rejected payment...`,
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
  }
});
```

**After:**
```typescript
console.log('[Payment Rejection]', {
  paymentId: payment.id,
  reference: payment.reference,
  rejectedBy: locals.user?.id || 'system',
  student: `${payment.user.name} (${payment.user.matricNo})`,
  reason: reason,
  timestamp: new Date().toISOString()
});
```

### 2. Confirm Endpoint
**Before:**
```typescript
await prisma.auditLog.create({
  data: {
    action: 'PAYMENT_CONFIRMED',
    entityType: 'Payment',
    entityId: paymentId,
    userId: locals.user?.id,
    details: { ... }
  }
});
```

**After:**
```typescript
console.log('[Payment Confirmation]', {
  paymentId: paymentId,
  reference: payment.reference,
  amount: payment.amount,
  confirmedBy: locals.user?.id || 'system',
  student: `${payment.user.name} (${payment.user.matricNo})`,
  timestamp: new Date().toISOString()
});
```

## What Still Gets Logged
Even without the audit log table, these actions are still tracked:

1. **Payment Status**: Updates from PENDING to CONFIRMED/FAILED
2. **Gateway Response**: JSON field stores rejection metadata
3. **Timestamps**: `confirmedAt` and failure timestamps
4. **Console Logs**: Detailed logs in terminal for debugging
5. **Admin User**: `confirmedBy` field stores admin ID

## Future Enhancement
If audit logging is needed, add this to your Prisma schema:

```prisma
model AuditLog {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  action      String
  entityType  String
  entityId    String
  userId      String?
  details     Json?
  timestamp   DateTime @default(now())
  ipAddress   String?
}
```

Then run: `bunx prisma db push`

## Testing
1. Try rejecting a payment - should work without errors
2. Try confirming a payment - should work without errors
3. Check terminal logs to see the console output
4. Verify payment status updates correctly in the database

## Files Modified
- `/src/routes/api/admin/payments/[id]/reject/+server.ts`
- `/src/routes/api/admin/payments/[id]/confirm/+server.ts`

## Date
October 14, 2025
