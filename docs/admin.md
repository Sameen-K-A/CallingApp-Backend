# 🛡️ Admin API

Admin endpoints for dashboard, user management, telecaller management, transactions, reports, and plans.

---

## 📋 Endpoints Overview

### Authentication

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| POST | `/admin/auth/google` | Google OAuth login | No |

### Dashboard

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| GET | `/admin/dashboard/stats` | Get dashboard statistics | Yes (ADMIN) |
| GET | `/admin/dashboard/user-distribution` | Get user/telecaller distribution by period | Yes (ADMIN) |

### User Management

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| GET | `/admin/users` | Get all users | Yes (ADMIN) |
| GET | `/admin/users/:id` | Get user details | Yes (ADMIN) |
| POST | `/admin/users/:id/block` | Block a user | Yes (ADMIN) |
| POST | `/admin/users/:id/unblock` | Unblock a user | Yes (ADMIN) |

### Telecaller Management

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| GET | `/admin/telecallers` | Get telecallers by status | Yes (ADMIN) |
| GET | `/admin/telecallers/:id` | Get telecaller details | Yes (ADMIN) |
| PATCH | `/admin/telecallers/:id/approve` | Approve telecaller | Yes (ADMIN) |
| PATCH | `/admin/telecallers/:id/reject` | Reject telecaller | Yes (ADMIN) |

### Transaction Management

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| GET | `/admin/transactions` | Get transactions by type | Yes (ADMIN) |
| GET | `/admin/transactions/:id` | Get transaction details | Yes (ADMIN) |
| POST | `/admin/withdrawals/:id/complete` | Complete withdrawal request | Yes (ADMIN) |
| POST | `/admin/withdrawals/:id/reject` | Reject withdrawal request | Yes (ADMIN) |

### Report Management

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| GET | `/admin/reports` | Get all reports | Yes (ADMIN) |
| GET | `/admin/reports/:id` | Get report details | Yes (ADMIN) |
| PATCH | `/admin/reports/:id/status` | Update report status | Yes (ADMIN) |

### Plan Management

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| GET | `/admin/plans` | Get all plans | Yes (ADMIN) |
| POST | `/admin/plans` | Create new plan | Yes (ADMIN) |
| PUT | `/admin/plans/:id` | Update plan | Yes (ADMIN) |
| DELETE | `/admin/plans/:id` | Delete plan | Yes (ADMIN) |

### Configuration Management

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| GET | `/admin/config` | Get application configuration | Yes (ADMIN) |
| PUT | `/admin/config` | Update application configuration | Yes (ADMIN) |

---

## 🔐 Authorization

- Admin authentication uses **Google OAuth**
- Token is stored in `authenticationToken` httpOnly cookie
- Only whitelisted emails can access admin panel

---

## 🔑 1. Google Login

Authenticate admin using Google OAuth token.

### Google Login Endpoint

POST `/admin/auth/google`

### Google Login Request Body

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| googleToken | string | Yes | Google OAuth ID token |

```json
{
  "googleToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Google Login Success Response (200)

Sets authenticationToken httpOnly cookie.

```json
{
  "success": true,
  "message": "Admin login successful"
}
```

### Google Login Error Responses

#### Invalid Token (401)

```json
{
  "success": false,
  "message": "Invalid Google token."
}
```

#### Invalid Payload (400)

```json
{
  "success": false,
  "message": "Invalid Google token payload."
}
```

#### Not Authorized (403)

```json
{
  "success": false,
  "message": "Access denied. You are not an authorized admin."
}
```

### Google Login Example - cURL

```bash
curl -X POST http://localhost:8000/admin/auth/google \
  -H "Content-Type: application/json" \
  -d '{"googleToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."}'
```

## 📊 2. Dashboard Stats

Get overall platform statistics.

### Dashboard Stats Endpoint

GET `/admin/dashboard/stats`

### Dashboard Stats Success Response (200)

```json
{
  "success": true,
  "data": {
    "revenue": {
      "totalRecharges": 150000,
      "totalWithdrawals": 75000,
      "platformProfit": 75000
    },
    "users": {
      "total": 1250,
      "newThisMonth": 180,
      "incompleteProfiles": 45
    },
    "telecallers": {
      "total": 85,
      "approved": 60,
      "pending": 15,
      "rejected": 10
    },
    "calls": {
      "total": 5420,
      "totalDurationMinutes": 27100,
      "averageDurationSeconds": 300
    }
  }
}
```

### Dashboard Stats Example - cURL

```bash
curl -X GET http://localhost:8000/admin/dashboard/stats \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 📈 3. User Distribution

Get count of users and telecallers registered within a specific time period. Useful for dashboard charts showing user/telecaller distribution.

### User Distribution Endpoint

GET `/admin/dashboard/user-distribution`

### User Distribution Query Parameters

| Parameter | Type | Required | Values | Description |
| --- | --- | --- | --- | --- |
| period | string | Yes | `today`, `last7days`, `last30days`, `all` | Time period filter for counting registrations |

**Period Filter Logic:**

| Period | Query Filter |
| --- | --- |
| `today` | `createdAt >= start of today (00:00:00)` |
| `last7days` | `createdAt >= 7 days ago` |
| `last30days` | `createdAt >= 30 days ago` |
| `all` | No date filter (total count) |

### User Distribution Success Response (200)

```json
{
  "success": true,
  "message": "User distribution fetched successfully",
  "data": {
    "users": 5430,
    "telecallers": 420
  }
}
```

### User Distribution Response Fields

| Field | Type | Description |
| --- | --- | --- |
| users | number | Count of users (role: USER) registered in the specified period |
| telecallers | number | Count of telecallers (role: TELECALLER) registered in the specified period |

### User Distribution Error Responses

#### Missing Period Parameter (400)

```json
{
  "success": false,
  "message": "Period is required."
}
```

#### Invalid Period Value (400)

```json
{
  "success": false,
  "message": "Period must be one of: today, last7days, last30days, all."
}
```

### User Distribution Example - cURL

```bash
# Get distribution for today
curl -X GET "http://localhost:8000/admin/dashboard/user-distribution?period=today" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get distribution for last 7 days
curl -X GET "http://localhost:8000/admin/dashboard/user-distribution?period=last7days" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get distribution for last 30 days
curl -X GET "http://localhost:8000/admin/dashboard/user-distribution?period=last30days" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get all-time distribution
curl -X GET "http://localhost:8000/admin/dashboard/user-distribution?period=all" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 👥 4. Get Users

Get paginated list of all regular users.

### Get Users Endpoint

GET `/admin/users`

### Get Users Query Parameters

| Parameter | Type | Default | Rules |
| --- | --- | --- | --- |
| page | number | 1 | Minimum 1 |
| limit | number | 20 | 1-100 |

### Get Users Success Response (200)

```json
{
  "success": true,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "phone": "9876543210",
      "name": "John Doe",
      "gender": "MALE",
      "accountStatus": "ACTIVE",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "phone": "9876543211",
      "name": null,
      "gender": null,
      "accountStatus": "ACTIVE",
      "createdAt": "2024-01-16T08:00:00.000Z"
    }
  ],
  "total": 150,
  "totalPages": 8
}
```

### Get Users Example - cURL

```bash
curl -X GET "http://localhost:8000/admin/users?page=1&limit=20" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 👤 5. Get User Details

Get detailed information about a specific user.

### Get User Details Endpoint

GET `/admin/users/:id`

### Get User Details Path Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| id | string | Yes | User ID (MongoDB ObjectId) |

### Get User Details Success Response (200)

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "phone": "9876543210",
    "dob": "1990-01-15",
    "gender": "MALE",
    "accountStatus": "ACTIVE",
    "walletBalance": 150,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "complaints": [
      {
        "_id": "507f1f77bcf86cd799439051",
        "reportedBy": "507f1f77bcf86cd799439031",
        "reportedByName": "Jane Smith",
        "description": "Inappropriate behavior during call",
        "status": "PENDING",
        "createdAt": "2024-01-18T14:00:00.000Z"
      }
    ],
    "totalComplaints": 1
  }
}
```

### Get User Details Error Responses

#### Get User Details User Not Found (404)

```json
{
  "success": false,
  "message": "User not found or user does not have a user role."
}
```

### Get User Details Example - cURL

```bash
curl -X GET http://localhost:8000/admin/users/507f1f77bcf86cd799439011 \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🚫 6. Block User

Block a user or approved telecaller.

### Block User Endpoint

POST `/admin/users/:id/block`

### Block User Path Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| id | string | Yes | User ID (MongoDB ObjectId) |

### Block User Success Response (200)

```json
{
  "success": true,
  "message": "John Doe has been blocked successfully."
}
```

### Block User Error Responses

#### Block User User Not Found (404)

```json
{
  "success": false,
  "message": "User not found."
}
```

#### Already Blocked (200)

```json
{
  "success": false,
  "message": "User is already blocked."
}
```

#### Block User Telecaller Not Approved (200)

```json
{
  "success": false,
  "message": "Only approved telecallers can be blocked. This telecaller is not yet approved."
}
```

### Block User Example - cURL

```bash
curl -X POST http://localhost:8000/admin/users/507f1f77bcf86cd799439011/block \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## ✅ 7. Unblock User

Unblock a previously blocked user or telecaller.

### Unblock User Endpoint

POST `/admin/users/:id/unblock`

### Unblock User Path Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| id | string | Yes | User ID (MongoDB ObjectId) |

### Unblock User Success Response (200)

```json
{
  "success": true,
  "message": "John Doe has been unblocked successfully."
}
```

### Unblock User Error Responses

#### User Not Found (404)

```json
{
  "success": false,
  "message": "User not found."
}
```

#### Already Active (200)

```json
{
  "success": false,
  "message": "User is already active."
}
```

#### Telecaller Not Approved (200)

```json
{
  "success": false,
  "message": "Only approved telecallers can be unblocked. This telecaller is not approved."
}
```

### Unblock User Example - cURL

```bash
curl -X POST http://localhost:8000/admin/users/507f1f77bcf86cd799439011/unblock \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 📞 8. Get Telecallers

Get paginated list of telecallers filtered by approval status.

### Get Telecallers Endpoint

GET `/admin/telecallers`

### Get Telecallers Query Parameters

| Parameter | Type | Required | Rules |
| --- | --- | --- | --- |
| status | string | Yes | PENDING, APPROVED, or REJECTED |
| page | number | No | Default: 1, Minimum: 1 |
| limit | number | No | Default: 20, Range: 1-100 |

### Get Telecallers Success Response (200)

```json
{
  "success": true,
  "telecallers": [
    {
      "_id": "507f1f77bcf86cd799439031",
      "phone": "9876543220",
      "name": "Jane Smith",
      "accountStatus": "ACTIVE",
      "createdAt": "2024-01-10T08:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439032",
      "phone": "9876543221",
      "name": "Sara Jones",
      "accountStatus": "ACTIVE",
      "createdAt": "2024-01-11T09:00:00.000Z"
    }
  ],
  "total": 15,
  "totalPages": 1
}
```

### Get Telecallers Example - cURL

```bash
curl -X GET "http://localhost:8000/admin/telecallers?status=PENDING&page=1&limit=20" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 📞 9. Get Telecaller Details

Get detailed information about a specific telecaller.

### Get Telecaller Details Endpoint

GET `/admin/telecallers/:id`

### Get Telecaller Details Path Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| id | string | Yes | Telecaller ID (MongoDB ObjectId) |

### Get Telecaller Details Success Response (200)

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439031",
    "name": "Jane Smith",
    "phone": "9876543220",
    "dob": "1992-05-20",
    "gender": "FEMALE",
    "accountStatus": "ACTIVE",
    "walletBalance": 500,
    "createdAt": "2024-01-10T08:00:00.000Z",
    "telecallerProfile": {
      "about": "Experienced telecaller with 5 years of experience.",
      "approvalStatus": "APPROVED",
      "verificationNotes": "",
      "presence": "ONLINE"
    },
    "complaints": [
      {
        "_id": "507f1f77bcf86cd799439052",
        "reportedBy": "507f1f77bcf86cd799439011",
        "reportedByName": "John Doe",
        "description": "Call quality was poor",
        "status": "RESOLVED",
        "createdAt": "2024-01-17T12:00:00.000Z"
      }
    ],
    "totalComplaints": 1
  }
}
```

### Get Telecaller Details Error Responses

#### Get Telecaller Details Telecaller Not Found (404)

```json
{
  "success": false,
  "message": "Telecaller not found or user does not have a telecaller role."
}
```

### Get Telecaller Details Example - cURL

```bash
curl -X GET http://localhost:8000/admin/telecallers/507f1f77bcf86cd799439031 \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## ✅ 10. Approve Telecaller

Approve a pending telecaller application.

### Approve Telecaller Endpoint

PATCH `/admin/telecallers/:id/approve`

### Approve Telecaller Path Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| id | string | Yes | Telecaller ID (MongoDB ObjectId) |

### Approve Telecaller Success Response (200)

```json
{
  "success": true,
  "message": "Telecaller approved successfully.",
  "data": {
    "_id": "507f1f77bcf86cd799439031",
    "name": "Jane Smith",
    "phone": "9876543220",
    "dob": "1992-05-20",
    "gender": "FEMALE",
    "accountStatus": "ACTIVE",
    "walletBalance": 0,
    "createdAt": "2024-01-10T08:00:00.000Z",
    "telecallerProfile": {
      "about": "Experienced telecaller with 5 years of experience.",
      "approvalStatus": "APPROVED",
      "verificationNotes": "",
      "presence": "OFFLINE"
    },
    "complaints": [],
    "totalComplaints": 0
  }
}
```

### Approve Telecaller Error Responses

#### Approve Telecaller Telecaller Not Found (404)

```json
{
  "success": false,
  "message": "Telecaller application not found."
}
```

#### Already Approved (400)

```json
{
  "success": false,
  "message": "This telecaller is already approved."
}
```

#### Cannot Approve Rejected (400)

```json
{
  "success": false,
  "message": "Cannot approve a rejected telecaller. They must re-apply first."
}
```

### Approve Telecaller Example - cURL

```bash
curl -X PATCH http://localhost:8000/admin/telecallers/507f1f77bcf86cd799439031/approve \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## ❌ 11. Reject Telecaller

Reject a telecaller application with a reason.

### Reject Telecaller Endpoint

PATCH `/admin/telecallers/:id/reject`

### Reject Telecaller Path Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| id | string | Yes | Telecaller ID (MongoDB ObjectId) |

### Reject Telecaller Request Body

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| reason | string | Yes | 10-500 characters |

```json
{
  "reason": "Profile information is incomplete. Please provide more details about your experience."
}
```

### Reject Telecaller Success Response (200)

```json
{
  "success": true,
  "message": "Telecaller rejected successfully.",
  "data": {
    "_id": "507f1f77bcf86cd799439031",
    "name": "Jane Smith",
    "phone": "9876543220",
    "dob": "1992-05-20",
    "gender": "FEMALE",
    "accountStatus": "ACTIVE",
    "walletBalance": 0,
    "createdAt": "2024-01-10T08:00:00.000Z",
    "telecallerProfile": {
      "about": "I want to be a telecaller.",
      "approvalStatus": "REJECTED",
      "verificationNotes": "Profile information is incomplete. Please provide more details about your experience.",
      "presence": "OFFLINE"
    },
    "complaints": [],
    "totalComplaints": 0
  }
}
```

### Reject Telecaller Error Responses

#### Telecaller Not Found (404)

```json
{
  "success": false,
  "message": "Telecaller application not found."
}
```

#### Reason Too Short (400)

```json
{
  "success": false,
  "message": "Reason must be at least 10 characters long."
}
```

### Reject Telecaller Example - cURL

```bash
curl -X PATCH http://localhost:8000/admin/telecallers/507f1f77bcf86cd799439031/reject \
  -H "Content-Type: application/json" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"reason": "Profile information is incomplete. Please provide more details about your experience."}'
```

## 💰 12. Get Transactions

Get paginated list of transactions filtered by type.

### Get Transactions Endpoint

GET `/admin/transactions`

### Get Transactions Query Parameters

| Parameter | Type | Required | Rules |
| --- | --- | --- | --- |
| type | string | Yes | RECHARGE or WITHDRAWAL |
| page | number | No | Default: 1, Minimum: 1 |
| limit | number | No | Default: 20, Range: 1-100 |

### Get Transactions Success Response (200)

```json
{
  "success": true,
  "transactions": [
    {
      "_id": "507f1f77bcf86cd799439061",
      "user": {
        "name": "John Doe"
      },
      "type": "RECHARGE",
      "amount": 499,
      "status": "SUCCESS",
      "createdAt": "2024-01-18T10:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439062",
      "user": {
        "name": "Mike Wilson"
      },
      "type": "RECHARGE",
      "amount": 199,
      "status": "PENDING",
      "createdAt": "2024-01-18T11:00:00.000Z"
    }
  ],
  "total": 250,
  "totalPages": 13
}
```

### Get Transactions Example - cURL

```bash
curl -X GET "http://localhost:8000/admin/transactions?type=RECHARGE&page=1&limit=20" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 💰 13. Get Transaction Details

Get detailed information about a specific transaction.

### Get Transaction Details Endpoint

GET `/admin/transactions/:id`

### Get Transaction Details Path Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| id | string | Yes | Transaction ID (MongoDB ObjectId) |

### Get Transaction Details Success Response - Recharge (200)

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439061",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "phone": "9876543210",
      "walletBalance": 650
    },
    "type": "RECHARGE",
    "amount": 499,
    "status": "SUCCESS",
    "coins": 600,
    "gatewayOrderId": "order_ABC123",
    "gatewayPaymentId": "pay_XYZ789",
    "createdAt": "2024-01-18T10:00:00.000Z",
    "updatedAt": "2024-01-18T10:01:00.000Z"
  }
}
```

### Get Transaction Details Success Response - Withdrawal (200)

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439063",
    "user": {
      "_id": "507f1f77bcf86cd799439031",
      "name": "Jane Smith",
      "phone": "9876543220",
      "walletBalance": 250
    },
    "type": "WITHDRAWAL",
    "amount": 500,
    "status": "SUCCESS",
    "bankDetails": {
      "accountNumber": "1234567890",
      "ifscCode": "SBIN0001234",
      "accountHolderName": "Jane Smith"
    },
    "transferReference": "NEFT1234567890",
    "processedAt": "2024-01-18T12:30:00.000Z",
    "createdAt": "2024-01-18T12:00:00.000Z",
    "updatedAt": "2024-01-18T12:30:00.000Z"
  }
}
```

### Get Transaction Details Error Responses

#### Transaction Not Found (404)

```json
{
  "success": false,
  "message": "Transaction not found."
}
```

### Get Transaction Details Example - cURL

```bash
curl -X GET http://localhost:8000/admin/transactions/507f1f77bcf86cd799439061 \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 💳 14. Complete Withdrawal

Complete a pending withdrawal request by processing the bank transfer and deducting coins from telecaller's wallet.

### Complete Withdrawal Endpoint

POST `/admin/withdrawals/:id/complete`

### Complete Withdrawal Path Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| id | string | Yes | Withdrawal transaction ID |

### Complete Withdrawal Headers

| Header | Value | Required |
| --- | --- | --- |
| Cookie | authenticationToken={token} | Yes |
| Content-Type | application/json | Yes |

### Complete Withdrawal Request Body

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| transferReference | string | Yes | Bank transfer reference/ID (5-100 characters) |

### Complete Withdrawal Request Example

```json
{
  "transferReference": "NEFT1234567890"
}
```

### Complete Withdrawal Success Response (200)

```json
{
  "success": true,
  "message": "Withdrawal completed successfully.",
  "data": {
    "_id": "507f1f77bcf86cd799439061",
    "status": "SUCCESS",
    "transferReference": "NEFT1234567890",
    "processedAt": "2024-01-15T14:30:00.000Z",
    "coinsDeducted": 500,
    "newBalance": 250
  }
}
```

### Complete Withdrawal Response Fields

| Field | Type | Description |
| --- | --- | --- |
| _id | string | Withdrawal transaction ID |
| status | string | Always "SUCCESS" |
| transferReference | string | Bank transfer reference provided |
| processedAt | string | Timestamp when withdrawal was processed |
| coinsDeducted | number | Number of coins deducted from wallet |
| newBalance | number | Telecaller's remaining wallet balance |

### Complete Withdrawal Error Responses

#### Withdrawal Not Found (404)

```json
{
  "success": false,
  "message": "Withdrawal transaction not found."
}
```

#### Withdrawal Already Processed (400)

```json
{
  "success": false,
  "message": "Cannot complete withdrawal. Current status is SUCCESS."
}
```

#### Withdrawal Processing Failed (500)

```json
{
  "success": false,
  "message": "Failed to complete withdrawal. Please try again."
}
```

### Complete Withdrawal Example - cURL

```bash
curl -X POST http://localhost:8000/admin/withdrawals/507f1f77bcf86cd799439061/complete \
  -H "Content-Type: application/json" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "transferReference": "NEFT1234567890"
  }'
```

## 🚫 15. Reject Withdrawal

Reject a pending withdrawal request without processing any payment.

### Reject Withdrawal Endpoint

POST `/admin/withdrawals/:id/reject`

### Reject Withdrawal Path Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| id | string | Yes | Withdrawal transaction ID |

### Reject Withdrawal Headers

| Header | Value | Required |
| --- | --- | --- |
| Cookie | authenticationToken={token} | Yes |

### Reject Withdrawal Success Response (200)

```json
{
  "success": true,
  "message": "Withdrawal request rejected.",
  "data": {
    "_id": "507f1f77bcf86cd799439061",
    "status": "REJECTED",
    "processedAt": "2024-01-15T14:30:00.000Z"
  }
}
```

### Reject Withdrawal Response Fields

| Field | Type | Description |
| --- | --- | --- |
| _id | string | Withdrawal transaction ID |
| status | string | Always "REJECTED" |
| processedAt | string | Timestamp when withdrawal was rejected |

### Reject Withdrawal Error Responses

#### Reject withdrawal, Withdrawal Not Found (404)

```json
{
  "success": false,
  "message": "Withdrawal transaction not found."
}
```

#### Reject withdrawal, Withdrawal Already Processed (400)

```json
{
  "success": false,
  "message": "Cannot reject withdrawal. Current status is SUCCESS."
}
```

#### Withdrawal Rejection Failed (500)

```json
{
  "success": false,
  "message": "Failed to reject withdrawal. Please try again."
}
```

### Reject Withdrawal Example - cURL

```bash
curl -X POST http://localhost:8000/admin/withdrawals/507f1f77bcf86cd799439061/reject \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 📝 16. Get Reports

Get paginated list of all user reports.

### Get Reports Endpoint

GET `/admin/reports`

### Get Reports Query Parameters

| Parameter | Type | Default | Rules |
| --- | --- | --- | --- |
| page | number | 1 | Minimum 1 |
| limit | number | 20 | 1-100 |

### Get Reports Success Response (200)

```json
{
  "success": true,
  "reports": [
    {
      "_id": "507f1f77bcf86cd799439071",
      "reportedBy": "507f1f77bcf86cd799439011",
      "reportedByName": "John Doe",
      "reportedAgainst": "507f1f77bcf86cd799439031",
      "reportedAgainstName": "Jane Smith",
      "description": "Inappropriate behavior during call",
      "status": "PENDING",
      "createdAt": "2024-01-18T14:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439072",
      "reportedBy": "507f1f77bcf86cd799439012",
      "reportedByName": "Mike Wilson",
      "reportedAgainst": "507f1f77bcf86cd799439032",
      "reportedAgainstName": "Sara Jones",
      "description": "Call was disconnected multiple times",
      "status": "RESOLVED",
      "createdAt": "2024-01-17T10:00:00.000Z"
    }
  ],
  "total": 45,
  "totalPages": 3
}
```

### Get Reports Example - cURL

```bash
curl -X GET "http://localhost:8000/admin/reports?page=1&limit=20" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 📝 17. Get Report Details

Get detailed information about a specific report including call details.

### Get Report Details Endpoint

GET `/admin/reports/:id`

### Get Report Details Path Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| id | string | Yes | Report ID (MongoDB ObjectId) |

### Get Report Details Success Response (200)

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439071",
    "description": "Inappropriate behavior during call",
    "status": "PENDING",
    "adminNotes": null,
    "resolvedAt": null,
    "createdAt": "2024-01-18T14:00:00.000Z",
    "updatedAt": "2024-01-18T14:00:00.000Z",
    "reporter": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "phone": "9876543210",
      "role": "USER",
      "accountStatus": "ACTIVE"
    },
    "reportedAgainst": {
      "_id": "507f1f77bcf86cd799439031",
      "name": "Jane Smith",
      "phone": "9876543220",
      "role": "TELECALLER",
      "accountStatus": "ACTIVE"
    },
    "call": {
      "_id": "507f1f77bcf86cd799439081",
      "status": "COMPLETED",
      "createdAt": "2024-01-18T13:30:00.000Z",
      "acceptedAt": "2024-01-18T13:30:15.000Z",
      "endedAt": "2024-01-18T13:45:00.000Z",
      "durationInSeconds": 885,
      "coinsSpent": 150,
      "coinsEarned": 120,
      "userFeedback": "Bad experience",
      "telecallerFeedback": null
    }
  }
}
```

### Get Report Details Error Responses

#### Get Report Details Report Not Found (404)

```json
{
  "success": false,
  "message": "Report not found."
}
```

### Get Report Details Example - cURL

```bash
curl -X GET http://localhost:8000/admin/reports/507f1f77bcf86cd799439071 \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 📝 18. Update Report Status

Update the status of a report with optional admin notes.

### Update Report Status Endpoint

PATCH `/admin/reports/:id/status`

### Update Report Status Path Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| id | string | Yes | Report ID (MongoDB ObjectId) |

### Update Report Status Request Body

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| status | string | Yes | PENDING, UNDER_REVIEW, RESOLVED, or DISMISSED |
| adminNotes | string | No | Max 2000 characters |

```json
{
  "status": "RESOLVED",
  "adminNotes": "Investigated the issue. Warning issued to the telecaller."
}
```

### Update Report Status Success Response (200)

```json
{
  "success": true,
  "message": "Report status updated successfully.",
  "data": {
    "status": "RESOLVED",
    "adminNotes": "Investigated the issue. Warning issued to the telecaller.",
    "resolvedAt": "2024-01-19T10:00:00.000Z"
  }
}
```

### Update Report Status Error Responses

#### Report Not Found (404)

```json
{
  "success": false,
  "message": "Report not found."
}
```

#### Invalid Status (400)

```json
{
  "success": false,
  "message": "Status must be one of: PENDING, UNDER_REVIEW, RESOLVED, DISMISSED."
}
```

### Update Report Status Example - cURL

```bash
curl -X PATCH http://localhost:8000/admin/reports/507f1f77bcf86cd799439071/status \
  -H "Content-Type: application/json" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"status": "RESOLVED", "adminNotes": "Investigated the issue. Warning issued to the telecaller."}'
```

## 💎 19. Get Plans

Get paginated list of all recharge plans.

### Get Plans Endpoint

GET `/admin/plans`

### Get Plans Query Parameters

| Parameter | Type | Default | Rules |
| --- | --- | --- | --- |
| page | number | 1 | Minimum 1 |
| limit | number | 20 | 1-100 |

### Get Plans Success Response (200)

```json
{
  "success": true,
  "plans": [
    {
      "_id": "507f1f77bcf86cd799439091",
      "amount": 99,
      "coins": 100,
      "discountPercentage": 0,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439092",
      "amount": 199,
      "coins": 220,
      "discountPercentage": 10,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439093",
      "amount": 499,
      "coins": 600,
      "discountPercentage": 20,
      "isActive": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    }
  ],
  "total": 3,
  "totalPages": 1
}
```

### Get Plans Example - cURL

```bash
curl -X GET "http://localhost:8000/admin/plans?page=1&limit=20" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 💎 20. Create Plan

Create a new recharge plan.

### Create Plan Endpoint

POST `/admin/plans`

### Create Plan Request Body

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| amount | number | Yes | Positive number |
| coins | number | Yes | Positive integer |
| discountPercentage | number | No | 0-99, Default: 0 |

```json
{
  "amount": 299,
  "coins": 350,
  "discountPercentage": 15
}
```

### Create Plan Success Response (201)

```json
{
  "success": true,
  "message": "Plan created successfully.",
  "data": {
    "_id": "507f1f77bcf86cd799439094",
    "amount": 299,
    "coins": 350,
    "discountPercentage": 15,
    "isActive": true,
    "createdAt": "2024-01-19T10:00:00.000Z",
    "updatedAt": "2024-01-19T10:00:00.000Z"
  }
}
```

### Create Plan Error Responses

#### Validation Error (400)

```json
{
  "success": false,
  "message": "Amount must be a positive number."
}
```

```json
{
  "success": false,
  "message": "Coins must be a positive number."
}
```

```json
{
  "success": false,
  "message": "Discount percentage cannot exceed 99."
}
```

### Create Plan Example - cURL

```bash
curl -X POST http://localhost:8000/admin/plans \
  -H "Content-Type: application/json" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"amount": 299, "coins": 350, "discountPercentage": 15}'
```

## 💎 21. Update Plan

Update an existing recharge plan.

### Update Plan Endpoint

PUT `/admin/plans/:id`

### Update Plan Path Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| id | string | Yes | Plan ID (MongoDB ObjectId) |

### Update Plan Request Body

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| amount | number | No | Positive number |
| coins | number | No | Positive integer |
| discountPercentage | number | No | 0-99 |
| isActive | boolean | No | true or false |

At least one field is required.

```json
{
  "amount": 349,
  "discountPercentage": 20,
  "isActive": true
}
```

### Update Plan Success Response (200)

```json
{
  "success": true,
  "message": "Plan updated successfully.",
  "data": {
    "_id": "507f1f77bcf86cd799439094",
    "amount": 349,
    "coins": 350,
    "discountPercentage": 20,
    "isActive": true,
    "createdAt": "2024-01-19T10:00:00.000Z",
    "updatedAt": "2024-01-19T12:00:00.000Z"
  }
}
```

### Update Plan Error Responses

#### Update Plan Plan Not Found (404)

```json
{
  "success": false,
  "message": "Plan not found."
}
```

#### No Fields Provided (400)

```json
{
  "success": false,
  "message": "At least one field is required to update."
}
```

### Update Plan Example - cURL

```bash
curl -X PUT http://localhost:8000/admin/plans/507f1f77bcf86cd799439094 \
  -H "Content-Type: application/json" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"amount": 349, "discountPercentage": 20, "isActive": true}'
```

## 💎 22. Delete Plan

Soft delete a recharge plan.

### Delete Plan Endpoint

DELETE `/admin/plans/:id`

### Delete Plan Path Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| id | string | Yes | Plan ID (MongoDB ObjectId) |

### Delete Plan Success Response (200)

```json
{
  "success": true,
  "message": "Plan deleted successfully."
}
```

### Delete Plan Error Responses

#### Plan Not Found (404)

```json
{
  "success": false,
  "message": "Plan not found."
}
```

### Delete Plan Example - cURL

```bash
curl -X DELETE http://localhost:8000/admin/plans/507f1f77bcf86cd799439094 \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 📊 Response Fields Reference

### User List Fields

| Field | Type | Nullable | Description |
| --- | --- | --- | --- |
| _id | string | No | Unique user ID |
| phone | string | No | Phone number |
| name | string | Yes | User's name |
| gender | string | Yes | MALE, FEMALE, or OTHER |
| accountStatus | string | No | ACTIVE or SUSPENDED |
| createdAt | string | No | Account creation timestamp |

### User Details Fields

| Field | Type | Description |
| --- | --- | --- |
| _id | string | Unique user ID |
| name | string | User's name |
| phone | string | Phone number |
| dob | string | Date of birth |
| gender | string | MALE, FEMALE, or OTHER |
| accountStatus | string | ACTIVE or SUSPENDED |
| walletBalance | number | Current wallet balance |
| createdAt | string | Account creation timestamp |
| complaints | array | Last 5 complaints against user |
| totalComplaints | number | Total complaints count |

### Telecaller Details Fields

| Field | Type | Description |
| --- | --- | --- |
| _id | string | Unique telecaller ID |
| name | string | Telecaller's name |
| phone | string | Phone number |
| dob | string | Date of birth |
| gender | string | FEMALE |
| accountStatus | string | ACTIVE or SUSPENDED |
| walletBalance | number | Current wallet balance |
| createdAt | string | Account creation timestamp |
| telecallerProfile.about | string | Telecaller's bio |
| telecallerProfile.approvalStatus | string | PENDING, APPROVED, or REJECTED |
| telecallerProfile.verificationNotes | string | Admin notes |
| telecallerProfile.presence | string | ONLINE, OFFLINE, or ON_CALL |
| complaints | array | Last 5 complaints (only for APPROVED) |
| totalComplaints | number | Total complaints count |

### Transaction Fields

| Field | Type | Description |
| --- | --- | --- |
| _id | string | Unique transaction ID |
| type | string | RECHARGE or WITHDRAWAL |
| amount | number | Transaction amount |
| status | string | PENDING, SUCCESS, FAILED, CANCELLED, or REJECTED |
| coins | number | Coins (RECHARGE only) |
| gatewayOrderId | string | Payment gateway order ID (RECHARGE only) |
| gatewayPaymentId | string | Payment gateway payment ID (RECHARGE only) |
| bankDetails | object | Bank account details (WITHDRAWAL only) |
| transferReference | string | Bank transfer reference (WITHDRAWAL only) |
| processedAt | string | Processing timestamp (WITHDRAWAL only) |
| createdAt | string | Transaction timestamp |
| updatedAt | string | Last update timestamp |

### Report Fields

| Field | Type | Description |
| --- | --- | --- |
| _id | string | Unique report ID |
| description | string | Report description |
| status | string | PENDING, UNDER_REVIEW, RESOLVED, or DISMISSED |
| adminNotes | string | Admin notes |
| resolvedAt | string | Resolution timestamp |
| createdAt | string | Report timestamp |
| reporter | object | Reporter user details |
| reportedAgainst | object | Reported user details |
| call | object | Related call details |

### Plan Fields

| Field | Type | Description |
| --- | --- | --- |
| _id | string | Unique plan ID |
| amount | number | Price in currency |
| coins | number | Coins received |
| discountPercentage | number | Discount percentage |
| isActive | boolean | Plan availability |
| createdAt | string | Creation timestamp |
| updatedAt | string | Last update timestamp |

---

## ⚙️ Configuration Management

Application configuration management endpoints for admin panel settings.

---

## 📖 23. Get Configuration

Retrieve current application configuration settings.

### Get Configuration Endpoint

GET `/admin/config`

### Get Configuration Success Response (200)

```json
{
  "success": true,
  "message": "Configuration retrieved successfully.",
  "data": {
    "withdrawal": {
      "inrToCoinRatio": {
        "value": 0.1,
        "label": "INR to Coin Ratio",
        "description": "This setting controls how many coins equal ₹1 when calculating withdrawal amounts. For example, if set to 1, then 1 coin equals ₹1, so 500 coins will be worth ₹500. If set to 2, then 2 coins equal ₹1, meaning 500 coins would be worth ₹250. A higher value means telecallers need more coins to earn the same amount of money."
      },
      "minWithdrawalCoins": {
        "value": 100,
        "label": "Minimum Withdrawal Coins",
        "description": "Minimum coins required for withdrawal"
      }
    },
    "videoCall": {
      "userCoinPerSec": {
        "value": 2,
        "label": "User Video Call Coins/Second",
        "description": "Coins charged per second for user video calls"
      },
      "telecallerCoinPerSec": {
        "value": 1,
        "label": "Telecaller Video Call Coins/Second",
        "description": "Coins earned per second for telecaller video calls"
      }
    },
    "audioCall": {
      "userCoinPerSec": {
        "value": 1,
        "label": "User Audio Call Coins/Second",
        "description": "Coins charged per second for user audio calls"
      },
      "telecallerCoinPerSec": {
        "value": 1,
        "label": "Telecaller Audio Call Coins/Second",
        "description": "Coins earned per second for telecaller audio calls"
      }
    },
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get Configuration Example - cURL

```bash
curl -X GET \
  http://localhost:3000/admin/config \
  -H "Cookie: authenticationToken=your_jwt_token"
```

---

## 📝 24. Update Configuration

Update application configuration settings.

### Update Configuration Endpoint

PUT `/admin/config`

### Update Configuration Request Body

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| inrToCoinRatio | number | No | INR to coin conversion rate (min: 0.01) |
| minWithdrawalCoins | number | No | Minimum coins for withdrawal (min: 1) |
| userVideoCallCoinPerSec | number | No | User video call coins per second (min: 1) |
| userAudioCallCoinPerSec | number | No | User audio call coins per second (min: 1) |
| telecallerVideoCallCoinPerSec | number | No | Telecaller video call coins per second (min: 1) |
| telecallerAudioCallCoinPerSec | number | No | Telecaller audio call coins per second (min: 1) |

**Note:** At least one configuration field must be provided.

```json
{
  "inrToCoinRatio": 0.15,
  "minWithdrawalCoins": 150,
  "userVideoCallCoinPerSec": 3
}
```

### Update Configuration Success Response (200)

```json
{
  "success": true,
  "message": "Configuration updated successfully.",
  "data": {
    "withdrawal": {
      "inrToCoinRatio": {
        "value": 0.15,
        "label": "INR to Coin Ratio",
        "description": "This setting controls how many coins equal ₹1 when calculating withdrawal amounts. For example, if set to 1, then 1 coin equals ₹1, so 500 coins will be worth ₹500. If set to 2, then 2 coins equal ₹1, meaning 500 coins would be worth ₹250. A higher value means telecallers need more coins to earn the same amount of money."
      },
      "minWithdrawalCoins": {
        "value": 150,
        "label": "Minimum Withdrawal Coins",
        "description": "Minimum coins required for withdrawal"
      }
    },
    "videoCall": {
      "userCoinPerSec": {
        "value": 3,
        "label": "User Video Call Coins/Second",
        "description": "Coins charged per second for user video calls"
      },
      "telecallerCoinPerSec": {
        "value": 1,
        "label": "Telecaller Video Call Coins/Second",
        "description": "Coins earned per second for telecaller video calls"
      }
    },
    "audioCall": {
      "userCoinPerSec": {
        "value": 1,
        "label": "User Audio Call Coins/Second",
        "description": "Coins charged per second for user audio calls"
      },
      "telecallerCoinPerSec": {
        "value": 1,
        "label": "Telecaller Audio Call Coins/Second",
        "description": "Coins earned per second for telecaller audio calls"
      }
    },
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

### Update Configuration Error Responses

#### Update config, Validation Error (400)

```json
{
  "success": false,
  "message": "INR to Coin ratio must be at least 0.01."
}
```

#### Update config, No Fields Provided (400)

```json
{
  "success": false,
  "message": "At least one configuration field is required."
}
```

### Update Configuration Example - cURL

```bash
curl -X PUT \
  http://localhost:3000/admin/config \
  -H "Content-Type: application/json" \
  -H "Cookie: authenticationToken=your_jwt_token" \
  -d '{
    "inrToCoinRatio": 0.15,
    "minWithdrawalCoins": 150
  }'
```

---

## 📋 Configuration Fields

### Withdrawal Configuration

| Field | Type | Description |
| --- | --- | --- |
| inrToCoinRatio | number | This setting controls how many coins equal ₹1 when calculating withdrawal amounts |
| minWithdrawalCoins | number | Minimum coins required for withdrawal |

### Video Call Configuration

| Field | Type | Description |
| --- | --- | --- |
| userCoinPerSec | number | Coins charged per second for user video calls |
| telecallerCoinPerSec | number | Coins earned per second for telecaller video calls |

### Audio Call Configuration

| Field | Type | Description |
| --- | --- | --- |
| userCoinPerSec | number | Coins charged per second for user audio calls |
| telecallerCoinPerSec | number | Coins earned per second for telecaller audio calls |
