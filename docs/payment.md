# 💳 Payment API

Payment endpoints for coin recharge and wallet management.

## 📋 Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| POST | /payment/create-order | Create Razorpay order for recharge | Yes (USER) |
| POST | /payment/verify | Verify payment and credit coins | Yes (USER) |
| POST | /payment/withdraw | Request coin withdrawal | Yes (TELECALLER) |

## 🔐 Authorization

All endpoints require:

- Valid JWT token
- Account status must be ACTIVE

**Role Requirements:**

- `/payment/create-order` and `/payment/verify`: User role must be USER
- `/payment/withdraw`: User role must be TELECALLER

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

## � 3. Withdraw Amount

Request withdrawal of coins from wallet to bank account. Withdrawal requests are submitted for admin approval.

### Withdraw Endpoint

```text
POST /payment/withdraw
```

### Withdraw Headers

| Header | Value | Required |
| --- | --- | --- |
| Authorization | Bearer {token} | Yes |
| Content-Type | application/json | Yes |

### Withdraw Request Body

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| coins | number | Yes | Integer > 0, minimum based on config, ≤ wallet balance |

### Withdraw Request Example

```json
{
  "coins": 100
}
```

### Withdraw Success Response (200)

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
      "accountHolderName": "John Doe"
    }
  }
}
```

### Withdraw Response Fields

| Field | Type | Description |
| --- | --- | --- |
| transactionId | string | Withdrawal transaction ID |
| coins | number | Coins requested for withdrawal |
| amount | number | Amount in INR (coins ÷ INR to coin ratio) |
| status | string | Always "PENDING" for new requests |
| currentBalance | number | Remaining wallet balance after request |
| bankDetails | object | Bank account details used for transfer |

### Withdraw Error Responses

#### Validation Error - Coins Required (400)

```json
{
  "success": false,
  "message": "Coins is required."
}
```

#### Validation Error - Invalid Coins (400)

```json
{
  "success": false,
  "message": "Coins must be a whole number."
}
```

#### Minimum Withdrawal Not Met (400)

```json
{
  "success": false,
  "message": "Minimum withdrawal is 50 coins."
}
```

#### Insufficient Balance (400)

```json
{
  "success": false,
  "message": "Insufficient balance. You have 30 coins."
}
```

#### Pending Withdrawal Exists (400)

```json
{
  "success": false,
  "message": "You already have a pending withdrawal request."
}
```

#### Account Not Found (404)

```json
{
  "success": false,
  "message": "Account not found."
}
```

#### Not a Telecaller (403)

```json
{
  "success": false,
  "message": "Only telecallers can withdraw."
}
```

#### Withdraw, Account Suspended (403)

```json
{
  "success": false,
  "message": "Your account has been suspended. Please contact support."
}
```

#### Application Not Approved (403)

```json
{
  "success": false,
  "message": "Your application must be approved to withdraw."
}
```

#### Bank Details Missing (400)

```json
{
  "success": false,
  "message": "Please add bank details before withdrawing."
}
```

#### Withdraw - Unauthorized (401)

```json
{
  "success": false,
  "message": "Authentication token is required."
}
```

#### Withdraw - Rate Limit Exceeded (429)

```json
{
  "success": false,
  "message": "Too many withdrawal requests. Please try again later."
}
```

### Withdraw Example - cURL

```bash
curl -X POST http://localhost:8000/payment/withdraw \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "coins": 100
  }'
```

## 🔄 Payment Flows

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

### Withdrawal Flow

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            WITHDRAWAL FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

1. Telecaller checks wallet balance
   └──► GET /users/profile (existing endpoint)

2. Telecaller requests withdrawal
   └──► POST /payment/withdraw { coins }
       └──► Validates: balance, min amount, bank details, no pending request

3. System creates PENDING withdrawal transaction
   └──► Stores bank details, calculates INR amount
   └──► Returns transaction details

4. Admin reviews withdrawal request
   └──► Admin panel shows pending withdrawals
   └──► Admin approves/rejects

5. On approval
   ├──► Transfer amount to bank account manually
   └──► Update transaction status to SUCCESS
   └──► Deduct coins from wallet

6. On rejection
   └──► Update transaction status to FAILED
   └──► No wallet deduction
```

## 📊 Transaction Status Reference

| Status | Description |
| --- | --- |
| PENDING | Order created awaiting payment, or withdrawal request awaiting admin approval |
| SUCCESS | Payment verified and coins credited, or withdrawal approved and processed |
| FAILED | Payment verification failed, or withdrawal rejected |
| CANCELLED | User cancelled payment |

### Transaction Types

| Type | Description |
| --- | --- |
| RECHARGE | Coin purchase via Razorpay |
| WITHDRAWAL | Coin withdrawal to bank account |

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
| /payment/withdraw | 3 requests | 1 hour |

## 🔒 Security Notes

- **Signature Verification**: All successful payments are verified using Razorpay's HMAC-SHA256 signature
- **User Validation**: Only the user who created the order can verify it
- **Status Check**: Already processed transactions cannot be verified again
- **Rate Limiting**: Prevents brute force and abuse
- **Withdrawal Validation**: Telecallers must have approved applications, bank details, sufficient balance, and no pending withdrawals
- **Role-based Access**: Recharge endpoints require USER role, withdrawal requires TELECALLER role
