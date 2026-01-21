# 🔒 Security Step 3: Stripe Webhook Security

## ✅ Implementation Complete

### 1. Signature Verification Enhanced

**File**: `supabase/functions/webhook-stripe/index.ts`

**Security Improvements**:
- ✅ **Method Check**: Only allows POST requests (405 for others)
- ✅ **Signature Check**: Verifies `stripe-signature` header is present
- ✅ **Secret Validation**: Ensures `STRIPE_WEBHOOK_SECRET` is configured
- ✅ **Body Validation**: Checks that request body is not empty
- ✅ **Signature Verification**: Uses `stripe.webhooks.constructEvent()` to verify signature
- ✅ **Error Handling**: Distinguishes between signature errors (401) and processing errors (400)

### 2. Security Flow

```
1. Request arrives → Check method (POST only)
2. Extract signature header → Verify it exists
3. Verify webhook secret is configured
4. Get raw body → Verify not empty
5. Construct event with signature verification → Throws if invalid
6. Process event → Handle errors gracefully
```

### 3. Error Responses

**Invalid Signature (401)**:
```json
{
  "error": "Invalid signature"
}
```

**Processing Error (400)**:
```json
{
  "error": "Webhook processing failed",
  "message": "Error details"
}
```

## 🧪 Testing

### Test Invalid Signature

```bash
curl -X POST https://your-project.supabase.co/functions/v1/webhook-stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: invalid-signature" \
  -d '{"type":"test.event"}'
```

Expected: `401 Invalid signature`

### Test Missing Signature

```bash
curl -X POST https://your-project.supabase.co/functions/v1/webhook-stripe \
  -H "Content-Type: application/json" \
  -d '{"type":"test.event"}'
```

Expected: `400 No signature provided`

### Test Valid Webhook (via Stripe Dashboard)

1. Go to Stripe Dashboard → Webhooks
2. Click on your endpoint
3. Click "Send test webhook"
4. Select event type (e.g., `checkout.session.completed`)
5. Verify it returns `200 { received: true }`

## 📝 Configuration

### Required Environment Variables

In Supabase Dashboard → Edge Functions → Secrets:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Stripe Webhook Setup

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/webhook-stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded` (if needed)
4. Copy the **Signing secret** (starts with `whsec_`)
5. Add to Supabase Secrets as `STRIPE_WEBHOOK_SECRET`

## 🔍 Security Best Practices

1. **Never Skip Signature Verification**: Always verify the signature before processing
2. **Use HTTPS**: Webhooks should only be sent over HTTPS (enforced by Stripe)
3. **Idempotency**: Stripe sends webhooks multiple times - ensure your handler is idempotent
4. **Logging**: Log all webhook attempts for audit trail
5. **Rate Limiting**: Consider rate limiting webhook endpoint if needed

## ⚠️ Common Issues

### "Invalid signature" Error

**Causes**:
- Webhook secret doesn't match Stripe dashboard
- Request body was modified (must be raw string)
- Wrong endpoint URL

**Solution**:
1. Verify `STRIPE_WEBHOOK_SECRET` in Supabase matches Stripe dashboard
2. Ensure body is passed as raw string (not parsed JSON)
3. Check webhook URL in Stripe dashboard

### "Webhook secret not configured" Error

**Solution**:
- Add `STRIPE_WEBHOOK_SECRET` to Supabase Edge Functions Secrets

---

**Status**: ✅ Step 3 Complete - Ready for Review

**Next**: Step 4 - Input Sanitization & Zod Validation
