# 🔒 Security Step 2: Rate Limiting (Anti-Spam)

## ✅ Implementation Complete

### 1. Rate Limiting Utility Created

**File**: `utils/rateLimit.ts`

- ✅ In-memory rate limiter (simple and effective for Vercel Serverless Functions)
- ✅ Configurable limits (max requests, time window)
- ✅ Automatic cleanup of expired entries
- ✅ IP address extraction from Vercel request headers

**Features**:
- Tracks requests per IP address
- Returns `allowed`, `remaining`, and `resetAt` timestamp
- Supports custom time windows (default: 1 hour)

### 2. Rate Limiting Applied to Booking Form

**File**: `api/submit-project-request.ts`

**Configuration**:
- ✅ **Limit**: 3 requests per IP per hour
- ✅ **Window**: 60 minutes (3,600,000 ms)
- ✅ **Response**: 429 Too Many Requests when limit exceeded

**Headers Added**:
- `X-RateLimit-Limit`: Maximum requests allowed (3)
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Timestamp when limit resets
- `Retry-After`: Seconds until retry is allowed (429 responses only)

### 3. Error Response

When rate limit is exceeded:

```json
{
  "success": false,
  "error": "Too many requests. Please try again later.",
  "retryAfter": 3600
}
```

**HTTP Status**: `429 Too Many Requests`

## 🧪 Testing

### Test Rate Limiting

1. **Normal Request** (should succeed):
   ```bash
   curl -X POST https://your-domain.vercel.app/api/submit-project-request \
     -H "Content-Type: application/json" \
     -d '{"artist_id":"...","client_email":"test@example.com",...}'
   ```
   
   Response headers:
   ```
   X-RateLimit-Limit: 3
   X-RateLimit-Remaining: 2
   X-RateLimit-Reset: 1234567890
   ```

2. **Exceed Limit** (4th request within 1 hour):
   ```bash
   # Make 4 requests quickly from same IP
   ```
   
   Response (4th request):
   ```json
   {
     "success": false,
     "error": "Too many requests. Please try again later.",
     "retryAfter": 3600
   }
   ```
   
   Status: `429 Too Many Requests`
   Headers:
   ```
   X-RateLimit-Limit: 3
   X-RateLimit-Remaining: 0
   X-RateLimit-Reset: 1234567890
   Retry-After: 3600
   ```

### Test from Different IPs

- Different IP addresses have separate rate limits
- Each IP can make 3 requests per hour independently

## 📝 Notes

### Limitations

1. **In-Memory Storage**:
   - Rate limit data is stored in memory
   - Cleared on serverless function cold start
   - Works well for moderate traffic

2. **For High Traffic**:
   - Consider upgrading to **Vercel KV** (Redis)
   - Or **Upstash Redis** for persistent rate limiting
   - Or use a dedicated rate limiting service

### Future Improvements

1. **Vercel KV Integration** (Recommended for Production):
   ```typescript
   import { kv } from '@vercel/kv';
   
   // Store rate limit data in Redis
   await kv.set(`ratelimit:${ip}`, count, { ex: 3600 });
   ```

2. **Per-Artist Rate Limiting**:
   - Limit submissions per artist (prevent spam to specific artists)
   - Combine IP + artist_id as identifier

3. **Progressive Rate Limiting**:
   - Stricter limits for suspicious IPs
   - Whitelist for known good IPs

## 🔍 Monitoring

### Log Rate Limit Hits

Add logging to track rate limit violations:

```typescript
if (!rateLimitResult.allowed) {
  console.warn(`Rate limit exceeded for IP: ${clientIP}`);
  // Optional: Send to monitoring service (Sentry, LogRocket, etc.)
}
```

### Metrics to Track

- Number of 429 responses per day
- Top IPs hitting rate limits
- Average requests per IP per hour

---

**Status**: ✅ Step 2 Complete - Ready for Review

**Next**: Step 3 - Stripe Webhook Security
