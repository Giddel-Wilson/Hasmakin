# Admin Payments Reject Functionality

## Enhancement
Added the ability for administrators to reject pending payments on the `/admin/payments` page.

## Changes Made

### 1. New API Endpoint
Created `/src/routes/api/admin/payments/[id]/reject/+server.ts`
- Handles POST requests to reject pending payments
- Validates that a rejection reason is provided
- Updates payment status to `FAILED` with the rejection reason
- Logs the rejection action in the activity log
- Only allows rejection of `PENDING` payments

**API Request:**
```typescript
POST /api/admin/payments/{id}/reject
Body: { reason: string }
```

**API Response:**
```typescript
{
  success: true,
  payment: Payment,
  message: "Payment rejected successfully"
}
```

### 2. Frontend Updates
Updated `/src/routes/admin/payments/+page.svelte`

#### Added `rejectPayment()` function:
- Prompts admin for rejection reason
- Confirms the action before proceeding
- Calls the reject API endpoint
- Updates the UI with the new payment status
- Shows success/error messages

#### Updated Actions Column:
**Before:**
- Pending: Only "Confirm" button
- Confirmed: "Refund" button
- Other: No actions

**After:**
- Pending: Both "Confirm" and "Reject" buttons side by side
- Confirmed: "Refund" button
- Failed: Shows "Rejected" label with truncated reason (hover for full text)
- Other: No actions

### 3. Visual Improvements
- Added tooltips to action buttons
- Increased spacing between action buttons (space-x-3)
- Show rejection reason for failed payments
- Truncate long rejection reasons with ellipsis (20 chars)

## User Flow

### Rejecting a Payment:
1. Admin clicks "Reject" button on a pending payment
2. System prompts for rejection reason
3. Admin enters reason and clicks OK
4. System asks for confirmation
5. Payment status changes to "FAILED"
6. Rejection reason is stored and displayed
7. Activity is logged for audit trail

## Database Changes
No schema changes required. The existing `Payment` model already has:
- `status` field (can be set to 'FAILED')
- `failureReason` field (stores rejection reason)
- `gatewayResponse` field (stores additional rejection metadata)

## Activity Logging
Each rejection is logged with:
- Action: `PAYMENT_REJECTED`
- User ID: Admin who rejected the payment
- Details: Payment reference, student name, matric no, and reason
- Timestamp and IP address

## Security
- Only admins can access the reject endpoint (protected by hooks)
- Requires explicit reason for rejection (cannot be empty)
- Confirmation dialog prevents accidental rejections
- All actions are logged for audit trail

## Testing
To test the reject functionality:
1. Navigate to `/admin/payments`
2. Find a payment with status "PENDING"
3. Click the "Reject" button
4. Enter a rejection reason (e.g., "Invalid payment proof")
5. Confirm the action
6. Verify the payment status changes to "FAILED"
7. Check that the rejection reason is displayed

## Files Modified
- `/src/routes/api/admin/payments/[id]/reject/+server.ts` (new)
- `/src/routes/admin/payments/+page.svelte` (updated)

## Date
October 14, 2025
