# 🛡️ Admin API

> Admin endpoints for dashboard management, user/telecaller management, transactions, reports, plans, and configuration.

---

## 📋 Quick Reference

### 🔐 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/auth/google` | Google OAuth login |

### 📊 Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/dashboard/stats` | Get dashboard statistics |
| `GET` | `/admin/dashboard/user-distribution` | Get user/telecaller distribution by period |
| `GET` | `/admin/dashboard/recharge-withdrawal-trends` | Get recharge/withdrawal trends |

### 👥 User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/users` | Get all users (paginated) |
| `GET` | `/admin/users/:id` | Get user details |
| `POST` | `/admin/users/:id/block` | Block a user |
| `POST` | `/admin/users/:id/unblock` | Unblock a user |

### 📞 Telecaller Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/telecallers` | Get telecallers by status |
| `GET` | `/admin/telecallers/:id` | Get telecaller details |
| `PATCH` | `/admin/telecallers/:id/approve` | Approve telecaller |
| `PATCH` | `/admin/telecallers/:id/reject` | Reject telecaller |

### 💰 Transaction Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/transactions` | Get transactions by type |
| `GET` | `/admin/transactions/:id` | Get transaction details |
| `POST` | `/admin/withdrawals/:id/complete` | Complete withdrawal |
| `POST` | `/admin/withdrawals/:id/reject` | Reject withdrawal |

### 📝 Report Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/reports` | Get all reports |
| `GET` | `/admin/reports/:id` | Get report details |
| `PATCH` | `/admin/reports/:id/status` | Update report status |

### 💎 Plan Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/plans` | Get all plans |
| `POST` | `/admin/plans` | Create new plan |
| `PUT` | `/admin/plans/:id` | Update plan |
| `DELETE` | `/admin/plans/:id` | Delete plan |

### ⚙️ Configuration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/config` | Get app configuration |
| `PUT` | `/admin/config` | Update app configuration |

---

## 🔐 Authorization

- Admin authentication uses **Google OAuth**
- Token is stored in `authenticationToken` httpOnly cookie
- Only whitelisted emails can access admin panel
- Include cookie in all requests: `Cookie: authenticationToken=<token>`

---

## 🔑 Google Login

Authenticate admin using Google OAuth token.

```
POST /admin/auth/google
```

### Request

#### Headers

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |

#### Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `googleToken` | `string` | ✅ Yes | Google OAuth ID token |

```json
{
  "googleToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response

#### ✅ Success `200 OK`

Sets `authenticationToken` httpOnly cookie.

```json
{
  "success": true,
  "message": "Admin login successful"
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | Invalid payload | `"Invalid Google token payload."` |
| `401` | Invalid token | `"Invalid Google token."` |
| `403` | Not authorized | `"Access denied. You are not an authorized admin."` |

### Example

```bash
curl -X POST http://localhost:8000/admin/auth/google \
  -H "Content-Type: application/json" \
  -d '{"googleToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."}'
```

---

## 📊 Dashboard Stats

Get overall platform statistics.

```
GET /admin/dashboard/stats
```

### Response

#### ✅ Success `200 OK`

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

### Example

```bash
curl -X GET http://localhost:8000/admin/dashboard/stats \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📈 User Distribution

Get count of users and telecallers by time period.  
**Useful for dashboard charts.**

```
GET /admin/dashboard/user-distribution
```

### Request

#### Query Parameters

| Parameter | Type | Required | Values |
|-----------|------|----------|--------|
| `period` | `string` | ✅ Yes | `today`, `last7days`, `last30days`, `all` |

**Period Filter Logic:**

| Period | Filter Applied |
|--------|----------------|
| `today` | `createdAt >= start of today (00:00:00)` |
| `last7days` | `createdAt >= 7 days ago` |
| `last30days` | `createdAt >= 30 days ago` |
| `all` | No date filter (total count) |

### Response

#### ✅ Success `200 OK`

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

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | Missing period | `"Period is required."` |
| `400` | Invalid period | `"Period must be one of: today, last7days, last30days, all."` |

### Example

```bash
curl -X GET "http://localhost:8000/admin/dashboard/user-distribution?period=last7days" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📈 Recharge & Withdrawal Trends

Get aggregated recharge and withdrawal data for a specified period.
**Useful for dashboard charts.**

```
GET /admin/dashboard/recharge-withdrawal-trends
```

### Request

#### Query Parameters

| Parameter | Type | Required | Values |
|-----------|------|----------|--------|
| `period` | `string` | ✅ Yes | `last24hours`, `last7days`, `last30days` |

**Period Logic:**
- `last24hours`: Hourly data for the past 24 hours.
- `last7days`: Daily data for the past 7 days.
- `last30days`: Daily data for the past 30 days.

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "message": "Recharge and withdrawal trends fetched successfully",
  "data": {
    "period": "last7days",
    "trends": [
      {
        "label": "Mon 12",
        "recharge": 1500,
        "withdrawal": 500
      },
      {
        "label": "Tue 13",
        "recharge": 2000,
        "withdrawal": 0
      }
    ]
  }
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | Missing period | `"Period is required."` |
| `400` | Invalid period | `"Period must be one of: last24hours, last7days, last30days."` |

### Example

```bash
curl -X GET "http://localhost:8000/admin/dashboard/recharge-withdrawal-trends?period=last7days" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 👥 Get Users

Get paginated list of all regular users.

```
GET /admin/users
```

### Request

#### Query Parameters

| Parameter | Type | Default | Validation |
|-----------|------|---------|------------|
| `page` | `number` | `1` | Minimum: 1 |
| `limit` | `number` | `20` | Range: 1-100 |

### Response

#### ✅ Success `200 OK`

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
    }
  ],
  "total": 150,
  "totalPages": 8
}
```

### Example

```bash
curl -X GET "http://localhost:8000/admin/users?page=1&limit=20" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 👤 Get User Details

Get detailed information about a specific user.

```
GET /admin/users/:id
```

### Request

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | User ID (MongoDB ObjectId) |

### Response

#### ✅ Success `200 OK`

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

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `404` | User not found | `"User not found or user does not have a user role."` |

### Example

```bash
curl -X GET http://localhost:8000/admin/users/507f1f77bcf86cd799439011 \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🚫 Block User

Block a user or approved telecaller.

```
POST /admin/users/:id/block
```

### Request

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | User ID (MongoDB ObjectId) |

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "message": "John Doe has been blocked successfully."
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `200` | Already blocked | `"User is already blocked."` |
| `200` | Telecaller not approved | `"Only approved telecallers can be blocked."` |
| `404` | User not found | `"User not found."` |

### Example

```bash
curl -X POST http://localhost:8000/admin/users/507f1f77bcf86cd799439011/block \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## ✅ Unblock User

Unblock a previously blocked user or telecaller.

```
POST /admin/users/:id/unblock
```

### Request

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | User ID (MongoDB ObjectId) |

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "message": "John Doe has been unblocked successfully."
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `200` | Already active | `"User is already active."` |
| `200` | Telecaller not approved | `"Only approved telecallers can be unblocked."` |
| `404` | User not found | `"User not found."` |

### Example

```bash
curl -X POST http://localhost:8000/admin/users/507f1f77bcf86cd799439011/unblock \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📞 Get Telecallers

Get paginated list of telecallers filtered by approval status.

```
GET /admin/telecallers
```

### Request

#### Query Parameters

| Parameter | Type | Required | Values |
|-----------|------|----------|--------|
| `status` | `string` | ✅ Yes | `PENDING`, `APPROVED`, `REJECTED` |
| `page` | `number` | ❌ No | Default: 1 |
| `limit` | `number` | ❌ No | Default: 20, Range: 1-100 |

### Response

#### ✅ Success `200 OK`

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
    }
  ],
  "total": 15,
  "totalPages": 1
}
```

### Example

```bash
curl -X GET "http://localhost:8000/admin/telecallers?status=PENDING&page=1&limit=20" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📞 Get Telecaller Details

Get detailed information about a specific telecaller.

```
GET /admin/telecallers/:id
```

### Request

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Telecaller ID (MongoDB ObjectId) |

### Response

#### ✅ Success `200 OK`

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
    "complaints": [...],
    "totalComplaints": 1
  }
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `404` | Not found | `"Telecaller not found or user does not have a telecaller role."` |

### Example

```bash
curl -X GET http://localhost:8000/admin/telecallers/507f1f77bcf86cd799439031 \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## ✅ Approve Telecaller

Approve a pending telecaller application.

```
PATCH /admin/telecallers/:id/approve
```

### Request

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Telecaller ID (MongoDB ObjectId) |

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "message": "Telecaller approved successfully.",
  "data": {
    "_id": "507f1f77bcf86cd799439031",
    "name": "Jane Smith",
    "telecallerProfile": {
      "approvalStatus": "APPROVED"
    }
  }
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | Already approved | `"This telecaller is already approved."` |
| `400` | Was rejected | `"Cannot approve a rejected telecaller. They must re-apply first."` |
| `404` | Not found | `"Telecaller application not found."` |

### Example

```bash
curl -X PATCH http://localhost:8000/admin/telecallers/507f1f77bcf86cd799439031/approve \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## ❌ Reject Telecaller

Reject a telecaller application with a reason.

```
PATCH /admin/telecallers/:id/reject
```

### Request

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Telecaller ID (MongoDB ObjectId) |

#### Body

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `reason` | `string` | ✅ Yes | 10-500 characters |

```json
{
  "reason": "Profile information is incomplete. Please provide more details about your experience."
}
```

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "message": "Telecaller rejected successfully.",
  "data": {
    "_id": "507f1f77bcf86cd799439031",
    "telecallerProfile": {
      "approvalStatus": "REJECTED",
      "verificationNotes": "Profile information is incomplete..."
    }
  }
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | Reason too short | `"Reason must be at least 10 characters long."` |
| `404` | Not found | `"Telecaller application not found."` |

### Example

```bash
curl -X PATCH http://localhost:8000/admin/telecallers/507f1f77bcf86cd799439031/reject \
  -H "Content-Type: application/json" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"reason": "Profile information is incomplete."}'
```

---

## 💰 Get Transactions

Get paginated list of transactions filtered by type.

```
GET /admin/transactions
```

### Request

#### Query Parameters

| Parameter | Type | Required | Values |
|-----------|------|----------|--------|
| `type` | `string` | ✅ Yes | `RECHARGE`, `WITHDRAWAL` |
| `page` | `number` | ❌ No | Default: 1 |
| `limit` | `number` | ❌ No | Default: 20, Range: 1-100 |

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "transactions": [
    {
      "_id": "507f1f77bcf86cd799439061",
      "user": { "name": "John Doe" },
      "type": "RECHARGE",
      "amount": 499,
      "status": "SUCCESS",
      "createdAt": "2024-01-18T10:00:00.000Z"
    }
  ],
  "total": 250,
  "totalPages": 13
}
```

### Example

```bash
curl -X GET "http://localhost:8000/admin/transactions?type=RECHARGE&page=1&limit=20" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 💰 Get Transaction Details

Get detailed information about a specific transaction.

```
GET /admin/transactions/:id
```

### Request

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Transaction ID (MongoDB ObjectId) |

### Response

#### ✅ Success `200 OK` - Recharge

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
    "createdAt": "2024-01-18T10:00:00.000Z"
  }
}
```

#### ✅ Success `200 OK` - Withdrawal

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
    "processedAt": "2024-01-18T12:30:00.000Z"
  }
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `404` | Not found | `"Transaction not found."` |

### Example

```bash
curl -X GET http://localhost:8000/admin/transactions/507f1f77bcf86cd799439061 \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 💳 Complete Withdrawal

Complete a pending withdrawal request.

```
POST /admin/withdrawals/:id/complete
```

### Request

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Withdrawal transaction ID |

#### Body

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `transferReference` | `string` | ✅ Yes | 5-100 characters |

```json
{
  "transferReference": "NEFT1234567890"
}
```

### Response

#### ✅ Success `200 OK`

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

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | Already processed | `"Cannot complete withdrawal. Current status is SUCCESS."` |
| `404` | Not found | `"Withdrawal transaction not found."` |
| `500` | Processing failed | `"Failed to complete withdrawal. Please try again."` |

### Example

```bash
curl -X POST http://localhost:8000/admin/withdrawals/507f1f77bcf86cd799439061/complete \
  -H "Content-Type: application/json" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"transferReference": "NEFT1234567890"}'
```

---

## 🚫 Reject Withdrawal

Reject a pending withdrawal request.

```
POST /admin/withdrawals/:id/reject
```

### Request

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Withdrawal transaction ID |

### Response

#### ✅ Success `200 OK`

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

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | Already processed | `"Cannot reject withdrawal. Current status is SUCCESS."` |
| `404` | Not found | `"Withdrawal transaction not found."` |

### Example

```bash
curl -X POST http://localhost:8000/admin/withdrawals/507f1f77bcf86cd799439061/reject \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📝 Get Reports

Get paginated list of all user reports.

```
GET /admin/reports
```

### Request

#### Query Parameters

| Parameter | Type | Default | Validation |
|-----------|------|---------|------------|
| `page` | `number` | `1` | Minimum: 1 |
| `limit` | `number` | `20` | Range: 1-100 |

### Response

#### ✅ Success `200 OK`

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
    }
  ],
  "total": 45,
  "totalPages": 3
}
```

### Example

```bash
curl -X GET "http://localhost:8000/admin/reports?page=1&limit=20" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📝 Get Report Details

Get detailed information about a specific report.

```
GET /admin/reports/:id
```

### Request

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Report ID (MongoDB ObjectId) |

### Response

#### ✅ Success `200 OK`

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
      "durationInSeconds": 885,
      "coinsSpent": 150,
      "coinsEarned": 120
    }
  }
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `404` | Not found | `"Report not found."` |

### Example

```bash
curl -X GET http://localhost:8000/admin/reports/507f1f77bcf86cd799439071 \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📝 Update Report Status

Update the status of a report with optional admin notes.

```
PATCH /admin/reports/:id/status
```

### Request

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Report ID (MongoDB ObjectId) |

#### Body

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `status` | `string` | ✅ Yes | `PENDING`, `UNDER_REVIEW`, `RESOLVED`, `DISMISSED` |
| `adminNotes` | `string` | ❌ No | Max 2000 characters |

```json
{
  "status": "RESOLVED",
  "adminNotes": "Investigated the issue. Warning issued to the telecaller."
}
```

### Response

#### ✅ Success `200 OK`

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

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | Invalid status | `"Status must be one of: PENDING, UNDER_REVIEW, RESOLVED, DISMISSED."` |
| `404` | Not found | `"Report not found."` |

### Example

```bash
curl -X PATCH http://localhost:8000/admin/reports/507f1f77bcf86cd799439071/status \
  -H "Content-Type: application/json" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"status": "RESOLVED", "adminNotes": "Issue resolved."}'
```

---

## 💎 Get Plans

Get paginated list of all recharge plans.

```
GET /admin/plans
```

### Request

#### Query Parameters

| Parameter | Type | Default | Validation |
|-----------|------|---------|------------|
| `page` | `number` | `1` | Minimum: 1 |
| `limit` | `number` | `20` | Range: 1-100 |

### Response

#### ✅ Success `200 OK`

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
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 3,
  "totalPages": 1
}
```

### Example

```bash
curl -X GET "http://localhost:8000/admin/plans?page=1&limit=20" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 💎 Create Plan

Create a new recharge plan.

```
POST /admin/plans
```

### Request

#### Body

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `amount` | `number` | ✅ Yes | Positive number |
| `coins` | `number` | ✅ Yes | Positive integer |
| `discountPercentage` | `number` | ❌ No | 0-99, Default: 0 |

```json
{
  "amount": 299,
  "coins": 350,
  "discountPercentage": 15
}
```

### Response

#### ✅ Success `201 Created`

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
    "createdAt": "2024-01-19T10:00:00.000Z"
  }
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | Invalid amount | `"Amount must be a positive number."` |
| `400` | Invalid coins | `"Coins must be a positive number."` |
| `400` | Invalid discount | `"Discount percentage cannot exceed 99."` |

### Example

```bash
curl -X POST http://localhost:8000/admin/plans \
  -H "Content-Type: application/json" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"amount": 299, "coins": 350, "discountPercentage": 15}'
```

---

## 💎 Update Plan

Update an existing recharge plan.  
**At least one field is required.**

```
PUT /admin/plans/:id
```

### Request

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Plan ID (MongoDB ObjectId) |

#### Body

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `amount` | `number` | ❌ No | Positive number |
| `coins` | `number` | ❌ No | Positive integer |
| `discountPercentage` | `number` | ❌ No | 0-99 |
| `isActive` | `boolean` | ❌ No | true or false |

```json
{
  "amount": 349,
  "discountPercentage": 20,
  "isActive": true
}
```

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "message": "Plan updated successfully.",
  "data": {
    "_id": "507f1f77bcf86cd799439094",
    "amount": 349,
    "coins": 350,
    "discountPercentage": 20,
    "isActive": true
  }
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | No fields provided | `"At least one field is required to update."` |
| `404` | Not found | `"Plan not found."` |

### Example

```bash
curl -X PUT http://localhost:8000/admin/plans/507f1f77bcf86cd799439094 \
  -H "Content-Type: application/json" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"amount": 349, "isActive": true}'
```

---

## 💎 Delete Plan

Soft delete a recharge plan.

```
DELETE /admin/plans/:id
```

### Request

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Plan ID (MongoDB ObjectId) |

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "message": "Plan deleted successfully."
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `404` | Not found | `"Plan not found."` |

### Example

```bash
curl -X DELETE http://localhost:8000/admin/plans/507f1f77bcf86cd799439094 \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## ⚙️ Get Configuration

Retrieve current application configuration settings.

```
GET /admin/config
```

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "message": "Configuration retrieved successfully.",
  "data": {
    "withdrawal": {
      "inrToCoinRatio": {
        "value": 0.1,
        "label": "INR to Coin Ratio",
        "description": "Controls how many coins equal ₹1 for withdrawals"
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

### Example

```bash
curl -X GET http://localhost:8000/admin/config \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## ⚙️ Update Configuration

Update application configuration settings.  
**At least one field is required.**

```
PUT /admin/config
```

### Request

#### Body

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `inrToCoinRatio` | `number` | ❌ No | Min: 0.01 |
| `minWithdrawalCoins` | `number` | ❌ No | Min: 1 |
| `userVideoCallCoinPerSec` | `number` | ❌ No | Min: 1 |
| `userAudioCallCoinPerSec` | `number` | ❌ No | Min: 1 |
| `telecallerVideoCallCoinPerSec` | `number` | ❌ No | Min: 1 |
| `telecallerAudioCallCoinPerSec` | `number` | ❌ No | Min: 1 |

```json
{
  "inrToCoinRatio": 0.15,
  "minWithdrawalCoins": 150,
  "userVideoCallCoinPerSec": 3
}
```

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "message": "Configuration updated successfully.",
  "data": {
    "withdrawal": {...},
    "videoCall": {...},
    "audioCall": {...},
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | Invalid ratio | `"INR to Coin ratio must be at least 0.01."` |
| `400` | No fields provided | `"At least one configuration field is required."` |

### Example

```bash
curl -X PUT http://localhost:8000/admin/config \
  -H "Content-Type: application/json" \
  -H "Cookie: authenticationToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"inrToCoinRatio": 0.15, "minWithdrawalCoins": 150}'
```

---

## 📊 Response Field Reference

### User Fields

| Field | Type | Description |
|-------|------|-------------|
| `_id` | `string` | Unique user ID |
| `phone` | `string` | Phone number |
| `name` | `string` | User's name (nullable) |
| `gender` | `string` | `MALE`, `FEMALE`, or `OTHER` |
| `accountStatus` | `string` | `ACTIVE` or `SUSPENDED` |
| `walletBalance` | `number` | Current coin balance |
| `complaints` | `array` | Last 5 complaints |
| `totalComplaints` | `number` | Total complaints count |

### Telecaller Fields

| Field | Type | Description |
|-------|------|-------------|
| `telecallerProfile.about` | `string` | Telecaller's bio |
| `telecallerProfile.approvalStatus` | `string` | `PENDING`, `APPROVED`, `REJECTED` |
| `telecallerProfile.verificationNotes` | `string` | Admin notes |
| `telecallerProfile.presence` | `string` | `ONLINE`, `OFFLINE`, `ON_CALL` |

### Transaction Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | `RECHARGE` or `WITHDRAWAL` |
| `amount` | `number` | Transaction amount |
| `status` | `string` | `PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`, `REJECTED` |
| `coins` | `number` | Coins (RECHARGE only) |
| `bankDetails` | `object` | Bank info (WITHDRAWAL only) |
| `transferReference` | `string` | Bank reference (WITHDRAWAL only) |

### Report Status Values

| Status | Description |
|--------|-------------|
| `PENDING` | New report, not yet reviewed |
| `UNDER_REVIEW` | Admin is investigating |
| `RESOLVED` | Issue has been resolved |
| `DISMISSED` | Report was invalid/dismissed |

### Plan Fields

| Field | Type | Description |
|-------|------|-------------|
| `_id` | `string` | Unique plan ID |
| `amount` | `number` | Price in currency |
| `coins` | `number` | Coins received |
| `discountPercentage` | `number` | Discount (0-99) |
| `isActive` | `boolean` | Plan availability |
