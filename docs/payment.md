# 💳 Payment API

> Payment endpoints for coin recharge (users) and withdrawal (telecallers).

---

## 📋 Quick Reference

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| `POST` | `/payment/create-order` | Create Razorpay order | `USER` |
| `POST` | `/payment/verify` | Verify payment & credit coins | `USER` |
| `POST` | `/payment/withdraw` | Request coin withdrawal | `TELECALLER` |

---

## 🔐 Authorization

All endpoints require:
- Valid JWT token in `Authorization: Bearer <token>` header
- Account status must be `ACTIVE`

**Role Requirements:**
- Create Order & Verify: `USER` role only
- Withdraw: `TELECALLER` role only (must be approved)

---

## 💰 Create Order

Create a Razorpay order for coin recharge.

```
POST /payment/create-order
```

### Request

#### Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <token>` |
| `Content-Type` | `application/json` |

#### Body

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `planId` | `string` | ✅ Yes | Valid MongoDB ObjectId (24 hex characters) |

```json
{
  "planId": "507f1f77bcf86cd799439011"
}
```

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "message": "Order created successfully.",
  "data": {
    "orderId": "order_NxR5Gf8tVqPmKl",
    "amount": 9900,
    "currency": "INR",
    "planId": "507f1f77bcf86cd799439011",
    "coins": 120,
    "razorpayKeyId": "rzp_test_xxxxxxxxxxxxx"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | `string` | Razorpay order ID (use for checkout) |
| `amount` | `number` | Amount in paise (₹99 = 9900) |
| `currency` | `string` | Currency code (`INR`) |
| `coins` | `number` | Coins credited on success |
| `razorpayKeyId` | `string` | Key for frontend checkout |

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | Invalid plan ID format | `"Invalid plan ID format."` |
| `400` | Plan ID missing | `"Plan ID is required."` |
| `403` | Account suspended | `"Your account has been suspended."` |
| `403` | Not a user | `"Only users can recharge coins."` |
| `404` | User not found | `"User not found."` |
| `404` | Plan not found | `"Plan not found or is no longer available."` |
| `429` | Rate limited | `"Too many requests."` |
| `502` | Razorpay error | `"Failed to create payment order."` |

### Example

```bash
curl -X POST http://localhost:8000/payment/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"planId": "507f1f77bcf86cd799439011"}'
```

---

## ✅ Verify Payment

Verify payment after Razorpay checkout. Handles success and cancellation.

```
POST /payment/verify
```

### Request

#### Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <token>` |
| `Content-Type` | `application/json` |

#### Body - Successful Payment

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `razorpay_order_id` | `string` | ✅ Yes | Order ID from Razorpay |
| `razorpay_payment_id` | `string` | ✅ Yes | Payment ID from Razorpay |
| `razorpay_signature` | `string` | ✅ Yes | Signature from Razorpay |

```json
{
  "razorpay_order_id": "order_NxR5Gf8tVqPmKl",
  "razorpay_payment_id": "pay_NxR5Hj9kWqRnMm",
  "razorpay_signature": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
}
```

#### Body - Cancelled Payment

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `razorpay_order_id` | `string` | ✅ Yes | Order ID from Razorpay |
| `cancelled` | `boolean` | ✅ Yes | Must be `true` |

```json
{
  "razorpay_order_id": "order_NxR5Gf8tVqPmKl",
  "cancelled": true
}
```

### Response

#### ✅ Success `200 OK` - Payment Verified

```json
{
  "success": true,
  "message": "Recharge successful! 120 coins added to your wallet.",
  "data": {
    "transactionId": "507f1f77bcf86cd799439013",
    "coins": 120,
    "newBalance": 250,
    "amount": 99
  }
}
```

#### ✅ Success `200 OK` - Payment Cancelled

```json
{
  "success": false,
  "message": "Payment was cancelled.",
  "data": null
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | Order ID missing | `"Razorpay order ID is required."` |
| `400` | Payment ID missing | `"Razorpay payment ID is required for verification."` |
| `400` | Signature missing | `"Razorpay signature is required for verification."` |
| `400` | Already processed | `"This transaction has already been processed."` |
| `400` | Invalid signature | `"Payment verification failed. Invalid signature."` |
| `403` | Unauthorized | `"You are not authorized to verify this transaction."` |
| `404` | Transaction not found | `"Transaction not found."` |
| `429` | Rate limited | `"Too many verification attempts."` |

### Example - Success

```bash
curl -X POST http://localhost:8000/payment/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "razorpay_order_id": "order_NxR5Gf8tVqPmKl",
    "razorpay_payment_id": "pay_NxR5Hj9kWqRnMm",
    "razorpay_signature": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
  }'
```

### Example - Cancelled

```bash
curl -X POST http://localhost:8000/payment/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"razorpay_order_id": "order_NxR5Gf8tVqPmKl", "cancelled": true}'
```

---

## 💸 Withdraw

Request withdrawal of coins to bank account.  
**Requires admin approval before processing.**

```
POST /payment/withdraw
```

### Request

#### Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <token>` |
| `Content-Type` | `application/json` |

#### Body

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `coins` | `number` | ✅ Yes | Integer > 0, ≥ min withdrawal, ≤ balance |

```json
{
  "coins": 100
}
```

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "message": "Withdrawal request submitted successfully. Please wait for admin approval.",
  "data": {
    "transactionId": "507f1f77bcf86cd799439014",
    "coins": 100,
    "amount": 50,
    "status": "PENDING",
    "currentBalance": 200,
    "bankDetails": {
      "accountNumber": "1234567890",
      "ifscCode": "SBIN0001234",
      "accountHolderName": "Jane Smith"
    }
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `transactionId` | `string` | Withdrawal transaction ID |
| `coins` | `number` | Coins requested |
| `amount` | `number` | INR amount (coins × conversion rate) |
| `status` | `string` | Always `PENDING` for new requests |
| `currentBalance` | `number` | Remaining wallet balance |
| `bankDetails` | `object` | Bank details for transfer |

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | Coins missing | `"Coins is required."` |
| `400` | Invalid coins | `"Coins must be a whole number."` |
| `400` | Below minimum | `"Minimum withdrawal is 50 coins."` |
| `400` | Insufficient balance | `"Insufficient balance. You have 30 coins."` |
| `400` | Pending exists | `"You already have a pending withdrawal request."` |
| `400` | No bank details | `"Please add bank details before withdrawing."` |
| `403` | Not a telecaller | `"Only telecallers can withdraw."` |
| `403` | Not approved | `"Your application must be approved to withdraw."` |
| `403` | Account suspended | `"Your account has been suspended."` |
| `404` | Account not found | `"Account not found."` |
| `429` | Rate limited | `"Too many withdrawal requests."` |

### Example

```bash
curl -X POST http://localhost:8000/payment/withdraw \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"coins": 100}'
```

---

## 🔄 Payment Flows

### Recharge Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    RECHARGE PAYMENT FLOW                    │
└─────────────────────────────────────────────────────────────┘

1. User selects plan
   └──► GET /users/plans

2. Frontend creates order
   └──► POST /payment/create-order { planId }
       └──► Returns: orderId, amount, razorpayKeyId

3. Frontend opens Razorpay checkout
   └──► Uses orderId and razorpayKeyId
   └──► User completes/cancels payment

4. Razorpay returns to frontend
   ├──► SUCCESS: razorpay_order_id, razorpay_payment_id, razorpay_signature
   └──► CANCELLED: User closed modal

5. Frontend verifies payment
   ├──► SUCCESS: POST /payment/verify { order_id, payment_id, signature }
   │    └──► Coins credited to wallet
   └──► CANCELLED: POST /payment/verify { order_id, cancelled: true }
        └──► Transaction marked as CANCELLED
```

### Withdrawal Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      WITHDRAWAL FLOW                        │
└─────────────────────────────────────────────────────────────┘

1. Telecaller requests withdrawal
   └──► POST /payment/withdraw { coins }
       └──► Creates PENDING transaction

2. Admin reviews request
   └──► Admin panel shows pending withdrawals

3. Admin decision
   ├──► APPROVE: Transfer to bank → Deduct coins → Status: SUCCESS
   └──► REJECT: No deduction → Status: REJECTED
```

---

## 📊 Reference

### Transaction Status

| Status | Description |
|--------|-------------|
| `PENDING` | Awaiting payment or admin approval |
| `SUCCESS` | Payment verified or withdrawal approved |
| `FAILED` | Payment failed or withdrawal rejected |
| `CANCELLED` | User cancelled payment |

### Transaction Types

| Type | Description |
|------|-------------|
| `RECHARGE` | Coin purchase via Razorpay |
| `WITHDRAWAL` | Coin withdrawal to bank |

### Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/payment/create-order` | 2 requests | 1 minute |
| `/payment/verify` | 5 requests | 1 minute |
| `/payment/withdraw` | 3 requests | 1 hour |

---

## 🔒 Security

- **Signature Verification**: HMAC-SHA256 signature validation
- **User Validation**: Only order creator can verify
- **Duplicate Prevention**: Processed transactions cannot be re-verified
- **Role-based Access**: Recharge = USER, Withdrawal = TELECALLER
- **Withdrawal Checks**: Approved status, bank details, sufficient balance, no pending requests
