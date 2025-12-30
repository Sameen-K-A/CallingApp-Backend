# 🔐 Authentication API

> OTP-based phone authentication for user login and registration.

---

## 📋 Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/send` | Send OTP to phone number |
| `POST` | `/auth/resend` | Resend OTP to existing user |
| `POST` | `/auth/verify` | Verify OTP and get access token |

---

## ⏱️ Rate Limits

| Endpoint | Requests | Window | Cooldown |
|----------|----------|--------|----------|
| `/auth/send` | 5 requests | 15 minutes | 60s between requests |
| `/auth/resend` | 5 requests | 15 minutes | 60s between requests |
| `/auth/verify` | 10 requests | 15 minutes | None |

---

## 📤 Send OTP

Sends a 5-digit OTP to the provided phone number.  
**Creates a new user account if the phone number doesn't exist.**

```
POST /auth/send
```

### Request

#### Headers

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |

#### Body

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `phone` | `string` | ✅ Yes | 10-15 digits, numbers only, no country code |

```json
{
  "phone": "9876543210"
}
```

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "message": "OTP sent successfully."
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | Invalid phone format | `"Phone number must be between 10 and 15 digits."` |
| `403` | Account suspended | `"Your account has been suspended. Please contact support."` |
| `429` | Rate limit exceeded | `"Too many requests. Please try again later."` |
| `429` | Cooldown active | `"Please wait 45 seconds, before requesting another OTP."` |

### Example

```bash
curl -X POST http://localhost:8000/auth/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'
```

---

## 🔄 Resend OTP

Resends OTP to an **existing user only**.  
Fails if the phone number is not registered.

```
POST /auth/resend
```

### Request

#### Headers

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |

#### Body

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `phone` | `string` | ✅ Yes | 10-15 digits, numbers only, no country code |

```json
{
  "phone": "9876543210"
}
```

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "message": "OTP resent successfully."
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `404` | User not found | `"No account found with this phone number."` |
| `403` | Account suspended | `"Your account has been suspended. Please contact support."` |
| `429` | Rate limit exceeded | `"Too many requests. Please try again later."` |
| `429` | Cooldown active | `"Please wait 45 seconds, before requesting another OTP."` |

### Example

```bash
curl -X POST http://localhost:8000/auth/resend \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'
```

---

## ✅ Verify OTP

Verifies the OTP and returns a **JWT access token** with user data.

```
POST /auth/verify
```

### Request

#### Headers

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |

#### Body

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `phone` | `string` | ✅ Yes | 10-15 digits only |
| `otp` | `string` | ✅ Yes | Exactly 5 digits |

```json
{
  "phone": "9876543210",
  "otp": "12345"
}
```

### Response

#### ✅ Success `200 OK`

The response includes a JWT token and user data. The user object varies based on profile completion and role.

---

**🆕 New User** *(profile not completed)*

> **Frontend Tip:** Check if `user.name` is `null` → redirect to `/complete-profile`

```json
{
  "success": true,
  "message": "OTP verified successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "phone": "9876543210",
    "accountStatus": "ACTIVE",
    "role": "USER",
    "wallet": {
      "balance": 0
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

**👤 Regular User** *(profile completed)*

> **Frontend Tip:** `user.name` exists → redirect to `/home`

```json
{
  "success": true,
  "message": "OTP verified successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "phone": "9876543210",
    "name": "John Doe",
    "dob": "1990-01-15",
    "gender": "MALE",
    "profile": "avatar-1",
    "language": "english",
    "accountStatus": "ACTIVE",
    "role": "USER",
    "wallet": {
      "balance": 150
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

**📞 Telecaller** *(with telecaller profile)*

> **Frontend Tip:** Check `user.role === "TELECALLER"` for telecaller-specific UI

```json
{
  "success": true,
  "message": "OTP verified successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "phone": "9876543211",
    "name": "Jane Smith",
    "dob": "1992-05-20",
    "gender": "FEMALE",
    "profile": "avatar-3",
    "language": "hindi",
    "accountStatus": "ACTIVE",
    "role": "TELECALLER",
    "wallet": {
      "balance": 500
    },
    "createdAt": "2024-01-10T08:00:00.000Z",
    "telecallerProfile": {
      "about": "Experienced telecaller with 5 years of experience.",
      "approvalStatus": "APPROVED",
      "verificationNotes": "Verified on 2024-01-12"
    }
  }
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | Invalid OTP | `"Invalid OTP. 3 attempt(s) remaining."` |
| `400` | OTP expired | `"OTP has expired. Please request a new OTP."` |
| `400` | OTP not found | `"OTP not found or expired. Please request a new OTP."` |
| `400` | Max attempts exceeded | `"Too many failed attempts. Please request a new OTP."` |
| `403` | Account suspended | `"Your account has been suspended. Please contact support."` |
| `429` | Rate limit exceeded | `"Too many attempts. Please try again later."` |

### Example

```bash
curl -X POST http://localhost:8000/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "otp": "12345"}'
```

---

## 📊 Response Field Reference

### User Object Fields

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `_id` | `string` | No | Unique user ID (MongoDB ObjectId) |
| `phone` | `string` | No | User's phone number |
| `name` | `string` | **Yes** | User's display name (`null` if profile not completed) |
| `dob` | `string` | Yes | Date of birth (ISO 8601 format) |
| `gender` | `string` | Yes | `MALE`, `FEMALE`, or `OTHER` |
| `profile` | `string` | Yes | Avatar identifier (e.g., `avatar-1` to `avatar-8`) |
| `language` | `string` | Yes | Preferred language code |
| `accountStatus` | `string` | No | `ACTIVE` or `SUSPENDED` |
| `role` | `string` | No | `USER` or `TELECALLER` |
| `wallet.balance` | `number` | No | Current coin balance |
| `createdAt` | `string` | No | Account creation timestamp (ISO 8601) |

### Telecaller-Specific Fields

Only present when `role === "TELECALLER"`:

| Field | Type | Description |
|-------|------|-------------|
| `telecallerProfile.about` | `string` | Telecaller's bio/description |
| `telecallerProfile.approvalStatus` | `string` | `PENDING`, `APPROVED`, or `REJECTED` |
| `telecallerProfile.verificationNotes` | `string` | Admin verification notes |

---

## 🔑 JWT Token

### Token Details

| Property | Value |
|----------|-------|
| Algorithm | `HS256` |
| Expiry | 7 days |
| Header Format | `Authorization: Bearer <token>` |

### Token Payload

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "phone": "9876543210",
  "role": "USER",
  "iat": 1705312200,
  "exp": 1705917000
}
```

### Usage

Include the token in the `Authorization` header for authenticated requests:

```bash
curl -X GET http://localhost:8000/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🔄 Authentication Flow

### New User Registration

```
┌─────────┐                              ┌─────────┐
│  Client │                              │  Server │
└────┬────┘                              └────┬────┘
     │                                        │
     │  POST /auth/send                       │
     │  { "phone": "9876543210" }             │
     │───────────────────────────────────────>│
     │                                        │ ✓ Create new user
     │                                        │ ✓ Generate 5-digit OTP
     │                                        │ ✓ Send SMS
     │  { "success": true }                   │
     │<───────────────────────────────────────│
     │                                        │
     │  POST /auth/verify                     │
     │  { "phone": "...", "otp": "12345" }    │
     │───────────────────────────────────────>│
     │                                        │ ✓ Verify OTP
     │                                        │ ✓ Generate JWT
     │  { "token": "...", "user": {...} }     │
     │<───────────────────────────────────────│
     │                                        │
     │  📱 Check: user.name === null?         │
     │     → Redirect to /complete-profile    │
     │                                        │
```

### Existing User Login

```
┌─────────┐                              ┌─────────┐
│  Client │                              │  Server │
└────┬────┘                              └────┬────┘
     │                                        │
     │  POST /auth/send                       │
     │  { "phone": "9876543210" }             │
     │───────────────────────────────────────>│
     │                                        │ ✓ Find existing user
     │                                        │ ✓ Generate 5-digit OTP
     │                                        │ ✓ Send SMS
     │  { "success": true }                   │
     │<───────────────────────────────────────│
     │                                        │
     │  POST /auth/verify                     │
     │  { "phone": "...", "otp": "12345" }    │
     │───────────────────────────────────────>│
     │                                        │ ✓ Verify OTP
     │                                        │ ✓ Generate JWT
     │  { "token": "...", "user": {...} }     │
     │<───────────────────────────────────────│
     │                                        │
     │  📱 Check: user.name exists?           │
     │     → Redirect to /home                │
     │                                        │
```
