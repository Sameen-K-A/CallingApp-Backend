# 💳 Payment API

Payment endpoints for coin recharge and wallet management.

## 📋 Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| POST | /payment/create-order | Create Razorpay order for recharge | Yes (USER) |
| POST | /payment/verify | Verify payment and credit coins | Yes (USER) |

## 🔐 Authorization

All endpoints require:

- Valid JWT token
- User role must be USER
- Account status must be ACTIVE

## 💰 1. Create Order

Create a Razorpay order for coin recharge. User selects a plan and receives order details to initiate payment.

### Create Order Endpoint

```text
POST /payment/create-order
```

### Create Order Headers

| Header | Value | Required |
| --- | --- | --- |
| Authorization | Bearer {token} | Yes |
| Content-Type | application/json | Yes |

### Create Order Request Body

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| planId | string | Yes | Valid MongoDB ObjectId (24 hex characters) |

### Create Order Request Example

```json
{
  "planId": "507f1f77bcf86cd799439011"
}
```

### Create Order Success Response (200)

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

### Create Order Response Fields

| Field | Type | Description |
| --- | --- | --- |
| orderId | string | Razorpay order ID (use this to initiate payment) |
| amount | number | Amount in paise (₹99 = 9900 paise) |
| currency | string | Currency code (INR) |
| planId | string | Selected plan ID |
| coins | number | Coins to be credited on successful payment |
| razorpayKeyId | string | Razorpay key ID for frontend checkout |

### Create Order Error Responses

#### Validation Error - Invalid Plan ID Format (400)

```json
{
  "success": false,
  "message": "Invalid plan ID format."
}
```

#### Validation Error - Plan ID Required (400)

```json
{
  "success": false,
  "message": "Plan ID is required."
}
```

#### User Not Found (404)

```json
{
  "success": false,
  "message": "User not found."
}
```

#### Account Suspended (403)

```json
{
  "success": false,
  "message": "Your account has been suspended. Please contact support."
}
```

#### Not a User (403)

```json
{
  "success": false,
  "message": "Only users can recharge coins."
}
```

#### Plan Not Found (404)

```json
{
  "success": false,
  "message": "Plan not found or is no longer available."
}
```

#### Razorpay Error (502)

```json
{
  "success": false,
  "message": "Failed to create payment order. Please try again."
}
```

#### Create Order - Unauthorized (401)

```json
{
  "success": false,
  "message": "Authentication token is required."
}
```

#### Create Order - Rate Limit Exceeded (429)

```json
{
  "success": false,
  "message": "Too many requests. Please wait before creating another order."
}
```

### Create Order Example - cURL

```bash
curl -X POST http://localhost:8000/payment/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "planId": "507f1f77bcf86cd799439011"
  }'
```

## ✅ 2. Verify Payment

Verify payment after Razorpay checkout completion. Handles success, failure, and cancellation scenarios.

### Verify Payment Endpoint

```text
POST /payment/verify
```

### Verify Payment Headers

| Header | Value | Required |
| --- | --- | --- |
| Authorization | Bearer {token} | Yes |
| Content-Type | application/json | Yes |

### Verify Payment Request Body

#### For Successful Payment

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| razorpay_order_id | string | Yes | Order ID from Razorpay |
| razorpay_payment_id | string | Yes | Payment ID from Razorpay |
| razorpay_signature | string | Yes | Signature from Razorpay |

#### For Cancelled Payment

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| razorpay_order_id | string | Yes | Order ID from Razorpay |
| cancelled | boolean | Yes | Must be true |

### Verify Payment Request Example - Success

```json
{
  "razorpay_order_id": "order_NxR5Gf8tVqPmKl",
  "razorpay_payment_id": "pay_NxR5Hj9kWqRnMm",
  "razorpay_signature": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
}
```

### Verify Payment Request Example - Cancelled

```json
{
  "razorpay_order_id": "order_NxR5Gf8tVqPmKl",
  "cancelled": true
}
```

### Verify Payment Success Response (200)

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

### Verify Payment Response Fields

| Field | Type | Description |
| --- | --- | --- |
| transactionId | string | Transaction record ID |
| coins | number | Coins credited to wallet |
| newBalance | number | Updated wallet balance |
| amount | number | Amount paid in INR |

### Verify Payment Cancelled Response (200)

```json
{
  "success": false,
  "message": "Payment was cancelled.",
  "data": null
}
```

### Verify Payment Error Responses

#### Validation Error - Order ID Required (400)

```json
{
  "success": false,
  "message": "Razorpay order ID is required."
}
```

#### Validation Error - Payment ID Required (400)

```json
{
  "success": false,
  "message": "Razorpay payment ID is required for verification."
}
```

#### Validation Error - Signature Required (400)

```json
{
  "success": false,
  "message": "Razorpay signature is required for verification."
}
```

#### Transaction Not Found (404)

```json
{
  "success": false,
  "message": "Transaction not found."
}
```

#### Transaction Already Processed (400)

```json
{
  "success": false,
  "message": "This transaction has already been processed."
}
```

#### Unauthorized Transaction (403)

```json
{
  "success": false,
  "message": "You are not authorized to verify this transaction."
}
```

#### Payment Verification Failed (400)

```json
{
  "success": false,
  "message": "Payment verification failed. Invalid signature."
}
```

#### Verify Payment - Unauthorized (401)

```json
{
  "success": false,
  "message": "Authentication token is required."
}
```

#### Verify Payment - Rate Limit Exceeded (429)

```json
{
  "success": false,
  "message": "Too many verification attempts. Please try again later."
}
```

### Verify Payment Example - cURL (Success)

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

### Verify Payment Example - cURL (Cancelled)

```bash
curl -X POST http://localhost:8000/payment/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "razorpay_order_id": "order_NxR5Gf8tVqPmKl",
    "cancelled": true
  }'
```

## 🔄 Payment Flow

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RECHARGE PAYMENT FLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘

1. User selects a plan from available plans
   └──► GET /users/plans (existing endpoint)

2. Frontend calls create-order
   └──► POST /payment/create-order { planId }
       └──► Returns: orderId, amount, razorpayKeyId

3. Frontend opens Razorpay checkout modal
   └──► Uses orderId and razorpayKeyId
   └──► User completes payment / cancels

4. Razorpay returns to frontend
   ├──► SUCCESS: razorpay_order_id, razorpay_payment_id, razorpay_signature
   └──► CANCELLED: User closed modal

5. Frontend calls verify
   ├──► SUCCESS: POST /payment/verify { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   │    └──► Coins credited, wallet updated
   └──► CANCELLED: POST /payment/verify { razorpay_order_id, cancelled: true }
        └──► Transaction marked as CANCELLED
```

## 📊 Transaction Status Reference

| Status | Description |
| --- | --- |
| PENDING | Order created, awaiting payment |
| SUCCESS | Payment verified, coins credited |
| FAILED | Payment verification failed (invalid signature) |
| CANCELLED | User cancelled payment |

## 📋 Plan Structure Reference

Plans are pre-configured by admin. Each plan contains:

| Field | Type | Description |
| --- | --- | --- |
| _id | string | Plan ID |
| amount | number | Price in INR |
| coins | number | Coins user receives |
| discountPercentage | number | Discount percentage (for display) |
| isActive | boolean | Whether plan is available |

### Example Plans

| Amount (₹) | Coins | Discount |
| --- | --- | --- |
| 99 | 120 | 21% |
| 199 | 250 | 25% |
| 499 | 650 | 30% |
| 999 | 1400 | 40% |

## ⚠️ Rate Limits

| Endpoint | Limit | Window |
| --- | --- | --- |
| /payment/create-order | 2 requests | 1 minute |
| /payment/verify | 5 requests | 1 minute |

## 🔒 Security Notes

- **Signature Verification**: All successful payments are verified using Razorpay's HMAC-SHA256 signature
- **User Validation**: Only the user who created the order can verify it
- **Status Check**: Already processed transactions cannot be verified again
- **Rate Limiting**: Prevents brute force and abuse
