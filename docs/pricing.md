# Finescan Pricing Structure

## Overview

Finescan offers a simple, two-tier pricing model designed to cater to both individual users and professionals. Our pricing structure focuses on providing value while maintaining competitive rates.

## Tiers

### Free Tier

- **Cost**: Free
- **Scans**: 3 per month
- **Storage**: 100MB
- **Model**: GPT-3.5 Turbo
- **Retention**: 7 days
- **Features**:
  - Basic document analysis
  - Risk assessment
  - Standard support

### Pro Tier

- **Cost**: R150/month
- **Scans**: 200 per month (R0.75 per scan)
- **Storage**: 5GB
- **Model**: GPT-4
- **Retention**: 30 days
- **Features**:
  - Advanced document analysis
  - Priority support
  - Detailed risk assessment
  - Batch processing
  - Enhanced AI capabilities

## Analytics

The system tracks the following pricing-related events:

- Plan views
- Upgrade initiations
- Successful upgrades
- Failed upgrades

Analytics data is stored in `analytics/pricing/events` collection with the following structure:

```typescript
interface PricingAnalytics {
  event: 'plan_viewed' | 'upgrade_started' | 'upgrade_completed' | 'upgrade_failed';
  planId: string;
  planTier: 'free' | 'pro';
  userId: string;
  previousTier?: 'free' | 'pro';
  error?: string;
  timestamp: Date;
}
```

## Implementation Details

### User Storage

- Free tier users get 100MB storage
- Pro tier users get 5GB storage
- Storage usage is tracked in the user's usage document

### Scan Limits

- Free tier: 3 scans per month
- Pro tier: 200 scans per month
- Limits reset monthly
- Usage is tracked in real-time

### Retention Policy

- Free tier: Documents are retained for 7 days
- Pro tier: Documents are retained for 30 days
- Automatic cleanup runs weekly

### Payment Processing

#### Overview

- Payment processing is handled through Paystack
- Monthly subscription model
- Auto-renewal enabled by default
- Secure payment processing with PCI compliance

#### Payment Flow

1. **Initiation**

   - User selects Pro plan
   - System checks user authentication
   - Validates current subscription status
   - Initiates Paystack payment modal

2. **Payment Methods**

   - Credit/Debit Cards
   - Bank Transfer
   - USSD
   - QR Code
   - Mobile Money

3. **Subscription Setup**

   ```typescript
   interface UserSubscription {
     planId: string;
     tier: PlanTier;
     status: 'active' | 'cancelled' | 'expired';
     startDate: Date;
     endDate: Date;
     autoRenew: boolean;
     paystackReference?: string;
   }
   ```

4. **Payment States**

   - `pending`: Initial payment being processed
   - `active`: Payment successful, subscription active
   - `cancelled`: User cancelled subscription
   - `expired`: Subscription ended without renewal

5. **Error Handling**
   - Failed payments are logged with error details
   - Users receive clear error messages
   - Automatic retry for failed renewals
   - Grace period for payment issues

#### Renewal Process

1. **Auto-Renewal**

   - Occurs 24 hours before subscription expiry
   - Uses stored payment method
   - Email notification sent to user

2. **Manual Renewal**

   - Available through dashboard
   - Can update payment method
   - Can change billing cycle

3. **Failed Renewals**
   - 3 retry attempts over 3 days
   - Email notifications for each attempt
   - Grace period of 3 days
   - Downgrade to free tier if all attempts fail

#### Cancellation Process

1. User can cancel from dashboard
2. Service continues until end of billing period
3. Auto-downgrade to free tier at period end
4. Option to reactivate before period ends

#### Refund Policy

- Pro-rated refunds available within 7 days
- Full refund for service outages
- No refund for partial month usage
- Refund process takes 5-7 business days

#### Security

- PCI DSS compliant
- No card details stored on our servers
- All transactions encrypted
- Fraud detection systems in place

#### Analytics Events

```typescript
// Payment-related events tracked
interface PaymentAnalytics extends PricingAnalytics {
  event:
    | 'payment_initiated'
    | 'payment_completed'
    | 'payment_failed'
    | 'subscription_renewed'
    | 'subscription_cancelled'
    | 'refund_requested';
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  transactionId?: string;
}
```

## Migration Notes

When migrating existing users:

1. Users on 'basic' tier will be moved to 'free'
2. Users on 'business' tier will be moved to 'pro'
3. Usage limits will be adjusted automatically
4. No service interruption during migration

## Technical Implementation

Key files:

- `libs/shared/services/src/lib/plans.config.ts`: Plan definitions
- `libs/shared/services/src/lib/subscription.service.ts`: Subscription logic
- `libs/shared/services/src/lib/usage-limit.service.ts`: Usage tracking
- `libs/shared/services/src/lib/paystack.service.ts`: Payment processing
- `apps/finescan/firebase/firestore.rules`: Security rules

## API Integration

### Paystack Integration

```typescript
// Payment initialization
await paystackService.initializePayment(planId, userEmail);

// Webhook handling
app.post('/webhook/paystack', async (req, res) => {
  const event = req.body;
  switch (event.event) {
    case 'charge.success':
      await handleSuccessfulPayment(event.data);
      break;
    case 'subscription.disable':
      await handleSubscriptionCancellation(event.data);
      break;
    // ... other events
  }
});
```

### Error Codes

- `PAYMENT_INIT_FAILED`: Payment initialization failed
- `INVALID_CARD`: Card validation failed
- `INSUFFICIENT_FUNDS`: Insufficient funds
- `SUBSCRIPTION_EXPIRED`: Subscription expired
- `RENEWAL_FAILED`: Auto-renewal failed
