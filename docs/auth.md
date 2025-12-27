# 🔐 Auth API

Authentication endpoints for OTP-based login.

---

## 📋 Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| POST | `/auth/send` | Send OTP to phone number | No |
| POST | `/auth/resend` | Resend OTP to existing user | No |
| POST | `/auth/verify` | Verify OTP and get token | No |

---

## ⏱️ Rate Limiting

| Endpoint | Limit | Cooldown |
| --- | --- | --- |
| `/auth/send` | 5 per 15 min per phone | 60 seconds between requests |
| `/auth/resend` | 5 per 15 min per phone | 60 seconds between requests |
| `/auth/verify` | 10 per 15 min per phone | None |

---

## 📤 1. Send OTP

Sends a 5-digit OTP to the provided phone number. Creates a new user account if phone doesn't exist.

### Send OTP Endpoint

POST `/auth/send`

#### Send OTP Request Body

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| phone | string | Yes | 10-15 digits only, no country code |

```json
{
  "phone": "9876543210"
}
```

#### Send OTP Success Response (200)

```json
{
  "success": true,
  "message": "OTP sent successfully."
}
```

#### Send OTP Error Responses

##### Send OTP Validation Error (400)

```json
{
  "success": false,
  "message": "Phone number must be between 10 and 15 digits."
}
```

##### Send OTP Account Suspended (403)

```json
{
  "success": false,
  "message": "Your account has been suspended. Please contact support."
}
```

##### Send OTP Rate Limited (429)

```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

##### Send OTP Cooldown Active (429)

```json
{
  "success": false,
  "message": "Please wait 45 seconds, before requesting another OTP."
}
```

#### Send OTP Example - cURL

```bash
curl -X POST http://localhost:8000/auth/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'
```

## 🔄 2. Resend OTP

Resends OTP to an existing user. Fails if user doesn't exist.

### Resend OTP Endpoint

POST `/auth/resend`

#### Resend OTP Request Body

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| phone | string | Yes | 10-15 digits only, no country code |

```json
{
  "phone": "9876543210"
}
```

#### Resend OTP Success Response (200)

```json
{
  "success": true,
  "message": "OTP resent successfully."
}
```

#### Resend OTP Error Responses

##### Resend OTP User Not Found (404)

```json
{
  "success": false,
  "message": "No account found with this phone number."
}
```

##### Resend OTP Account Suspended (403)

```json
{
  "success": false,
  "message": "Your account has been suspended. Please contact support."
}
```

##### Resend OTP Rate Limited (429)

```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

##### Resend OTP Cooldown Active (429)

```json
{
  "success": false,
  "message": "Please wait 45 seconds, before requesting another OTP."
}
```

#### Resend OTP Example - cURL

```bash
curl -X POST http://localhost:8000/auth/resend \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'
```

## ✅ 3. Verify OTP

Verifies the OTP and returns a JWT token with user data.

### Verify OTP Endpoint

POST `/auth/verify`

#### Verify OTP Request Body

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| phone | string | Yes | 10-15 digits only |
| otp | string | Yes | Exactly 5 digits |

```json
{
  "phone": "9876543210",
  "otp": "12345"
}
```

#### Verify OTP Success Responses

##### Verify OTP New User (200)

User who just registered and hasn't completed profile setup.

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

##### Verify OTP Regular User (200)

User with completed profile.

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

##### Verify OTP Telecaller (200)

User registered as telecaller.

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

#### Verify OTP Error Responses

##### Verify OTP Invalid OTP (400)

```json
{
  "success": false,
  "message": "Invalid OTP. 3 attempt(s) remaining."
}
```

##### Verify OTP OTP Expired (400)

```json
{
  "success": false,
  "message": "OTP has expired. Please request a new OTP."
}
```

##### Verify OTP OTP Not Found (400)

```json
{
  "success": false,
  "message": "OTP not found or expired. Please request a new OTP."
}
```

##### Verify OTP Max Attempts Exceeded (400)

```json
{
  "success": false,
  "message": "Too many failed attempts. Please request a new OTP."
}
```

##### Verify OTP Account Suspended (403)

```json
{
  "success": false,
  "message": "Your account has been suspended. Please contact support."
}
```

##### Verify OTP Rate Limited (429)

```json
{
  "success": false,
  "message": "Too many attempts. Please try again later."
}
```

#### Verify OTP Example - cURL

```bash
curl -X POST http://localhost:8000/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "otp": "12345"}'
```

## 📊 User Response Fields

### Common Fields (All Users)

| Field | Type | Nullable | Description |
| --- | --- | --- | --- |
| _id | string | No | Unique user ID |
| phone | string | No | Phone number |
| name | string | Yes | User's name |
| dob | string | Yes | Date of birth (ISO format) |
| gender | string | Yes | MALE, FEMALE, or OTHER |
| profile | string | Yes | Avatar identifier |
| language | string | Yes | Preferred language |
| accountStatus | string | No | ACTIVE or SUSPENDED |
| role | string | No | USER or TELECALLER |
| wallet.balance | number | No | Current wallet balance |
| createdAt | string | No | Account creation timestamp |

### Telecaller Additional Fields

| Field | Type | Nullable | Description |
| --- | --- | --- | --- |
| telecallerProfile.about | string | Yes | Telecaller's bio |
| telecallerProfile.approvalStatus | string | No | PENDING, APPROVED, or REJECTED |
| telecallerProfile.verificationNotes | string | Yes | Admin notes |

## 🔑 Token Details

| Property | Value |
| --- | --- |
| Algorithm | HS256 |
| Expiry | 7 days |
| Payload | userId, phone, role |

### Token Payload Structure

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "phone": "9876543210",
  "role": "USER",
  "iat": 1705312200,
  "exp": 1705917000
}
```

## 🔄 Auth Flow Diagram

### New User Flow

```text
User                          Server
  |                              |
  |  POST /auth/send             |
  |  { phone }                   |
  |----------------------------->|
  |                              | Create user
  |                              | Generate OTP
  |                              | Send SMS
  |    { success: true }         |
  |<-----------------------------|
  |                              |
  |  POST /auth/verify           |
  |  { phone, otp }              |
  |----------------------------->|
  |                              | Verify OTP
  |                              | Generate JWT
  |    { token, user }           |
  |<-----------------------------|
  |                              |
  |  Navigate to /complete-profile
  |  (user.name is null)         |
```

### Existing User Flow

```text
User                          Server
  |                              |
  |  POST /auth/send             |
  |  { phone }                   |
  |----------------------------->|
  |                              | Find user
  |                              | Generate OTP
  |                              | Send SMS
  |    { success: true }         |
  |<-----------------------------|
  |                              |
  |  POST /auth/verify           |
  |  { phone, otp }              |
  |----------------------------->|
  |                              | Verify OTP
  |                              | Generate JWT
  |    { token, user }           |
  |<-----------------------------|
  |                              |
  |  Navigate to /home           |
  |  (user.name exists)          |
```
