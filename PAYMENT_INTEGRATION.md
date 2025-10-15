# Paystack Payment Integration Guide
## University of Port Harcourt Hostel Allocation System

This guide explains how to set up and use the integrated Paystack payment system for hostel fee payments.

## Overview

The system now supports real payment processing through Paystack, a leading Nigerian payment gateway. Students can pay their hostel fees securely using:
- Debit/Credit Cards (Visa, Mastercard, Verve)
- Bank Transfers
- USSD
- Mobile Money

## Setup Instructions

### 1. Get Paystack API Keys

1. Visit [https://paystack.com](https://paystack.com) and create an account
2. Complete your business verification
3. Navigate to Settings → API Keys & Webhooks
4. Copy your **Secret Key** and **Public Key**

### 2. Update Environment Variables

Edit your `.env` file and add your Paystack keys:

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY="sk_live_your_actual_secret_key_here"
PAYSTACK_PUBLIC_KEY="pk_live_your_actual_public_key_here"
```

**Important Notes:**
- Use `sk_test_...` and `pk_test_...` for testing
- Use `sk_live_...` and `pk_live_...` for production
- **NEVER** commit your `.env` file to version control
- Keep your secret key secure

### 3. Configure Webhook URL

Webhooks allow Paystack to notify your system about payment status changes.

1. Go to Paystack Dashboard → Settings → API Keys & Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/paystack`
3. Save the configuration

**For Development:**
- Use [ngrok](https://ngrok.com) to expose your local server
- Run: `ngrok http 5173`
- Use the ngrok URL for webhooks: `https://your-ngrok-url.ngrok.io/api/webhooks/paystack`

## How It Works

### Payment Flow

1. **Student Initiates Payment**
   - Student clicks "Make Payment" button
   - System validates application status
   - Payment record is created in database

2. **Paystack Initialization**
   - System calls Paystack API to initialize transaction
   - Receives authorization URL
   - Student is redirected to Paystack checkout page

3. **Payment Processing**
   - Student completes payment on Paystack
   - Paystack processes the transaction
   - Student is redirected back to verification page

4. **Payment Verification**
   - System verifies payment with Paystack
   - Updates payment status in database
   - Updates application payment status
   - Shows success/failure message to student

5. **Webhook Notification** (Backup)
   - Paystack sends webhook notification
   - System updates payment status
   - Ensures no missed payments

### API Endpoints

#### 1. Initialize Payment
**POST** `/api/student/payments`

Request:
```json
{
  "amount": 25000,
  "paymentMethod": "CARD"
}
```

Response:
```json
{
  "success": true,
  "authorization_url": "https://checkout.paystack.com/xxx",
  "access_code": "xxx",
  "reference": "UNIPORT-xxx",
  "payment": {
    "id": "payment_id",
    "reference": "UNIPORT-xxx",
    "amount": 25000,
    "status": "PENDING"
  }
}
```

#### 2. Verify Payment
**GET** `/api/student/payments/verify?reference=UNIPORT-xxx`

Response:
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "payment": {
    "reference": "UNIPORT-xxx",
    "amount": 25000,
    "status": "COMPLETED",
    "paidAt": "2025-10-12T00:00:00.000Z"
  }
}
```

#### 3. Webhook Handler
**POST** `/api/webhooks/paystack`

Handles Paystack webhook notifications automatically.

## Testing

### Test Payment Flow

1. **Use Test Mode**
   ```env
   PAYSTACK_SECRET_KEY="sk_test_xxx"
   PAYSTACK_PUBLIC_KEY="pk_test_xxx"
   ```

2. **Test Cards**
   Use Paystack test cards:
   - Success: `4084084084084081` (CVV: 408, PIN: 0000)
   - Insufficient Funds: `5060666666666666666`
   - Invalid Card: `5060666666666666665`

3. **Test Webhooks**
   ```bash
   curl -X POST http://localhost:5173/api/webhooks/paystack \
     -H "Content-Type: application/json" \
     -H "x-paystack-signature: your_signature" \
     -d '{"event": "charge.success", "data": {...}}'
   ```

## Admin View

Administrators can view all payments in the admin panel:

**Navigate to:** `/admin/payments`

Features:
- View all payment transactions
- Filter by status (Pending, Completed, Failed)
- Search by student name, matric number, or reference
- Export payment records
- Manual payment verification

## Troubleshooting

### Payment Not Completing

1. **Check Webhook Configuration**
   - Verify webhook URL is correct
   - Check webhook logs in Paystack dashboard
   - Ensure server is accessible

2. **Verify API Keys**
   - Confirm keys are correct in `.env`
   - Check if using test/live keys appropriately
   - Restart server after changing keys

3. **Check Database**
   ```typescript
   // Check payment status
   await prisma.payment.findFirst({
     where: { reference: 'UNIPORT-xxx' }
   });
   ```

### Common Errors

#### "Payment gateway URL not received"
- Check Paystack API keys
- Verify network connectivity
- Check server logs for errors

#### "Payment already exists"
- Student already has pending/completed payment
- Admin needs to verify existing payment status

#### "Invalid signature" (Webhook)
- Secret key mismatch
- Check `.env` configuration
- Verify webhook is from Paystack

## Security Best Practices

1. **Protect API Keys**
   - Never expose secret keys in frontend
   - Use environment variables
   - Rotate keys periodically

2. **Verify Webhooks**
   - Always validate webhook signatures
   - Verify payment status with Paystack API
   - Log all webhook activities

3. **Prevent Duplicate Payments**
   - Check for existing payments
   - Use unique references
   - Validate application status

4. **SSL/HTTPS**
   - Use HTTPS in production
   - Paystack requires secure connections
   - Obtain SSL certificate for domain

## Production Checklist

- [ ] Switch to live API keys
- [ ] Configure production webhook URL
- [ ] Test payment flow end-to-end
- [ ] Set up payment notifications (email/SMS)
- [ ] Configure payment refund process
- [ ] Train staff on admin payment management
- [ ] Set up monitoring and alerts
- [ ] Back up payment records regularly

## Support

### Paystack Support
- Documentation: https://paystack.com/docs
- Email: support@paystack.com
- Phone: +234 (01) 2012345

### System Support
- Check server logs for errors
- Review webhook logs in Paystack dashboard
- Contact system administrator

## Code References

### Payment Service
`src/lib/server/payments.ts` - Paystack integration service

### API Endpoints
- `src/routes/api/student/payments/+server.ts` - Payment initialization
- `src/routes/api/student/payments/verify/+server.ts` - Payment verification
- `src/routes/api/webhooks/paystack/+server.ts` - Webhook handler

### Frontend Pages
- `src/routes/dashboard/payments/+page.svelte` - Student payment page
- `src/routes/dashboard/payments/verify/+page.svelte` - Payment verification page
- `src/routes/admin/payments/+page.svelte` - Admin payment management

## Future Enhancements

- [ ] Multiple payment installments
- [ ] Automatic payment reminders
- [ ] Payment receipt generation (PDF)
- [ ] SMS notifications for payment status
- [ ] Support for other payment gateways (Flutterwave, etc.)
- [ ] Payment analytics and reporting
