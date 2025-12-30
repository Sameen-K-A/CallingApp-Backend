# 📞 Telecaller API

> Telecaller endpoints for profile management, reapplication, and bank details.

---

## 📋 Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `PATCH` | `/telecaller/edit-profile` | Edit telecaller profile |
| `PATCH` | `/telecaller/reapply` | Reapply after rejection |
| `GET` | `/telecaller/bank-details` | Get bank details |
| `POST` | `/telecaller/bank-details` | Add/update bank details |
| `DELETE` | `/telecaller/bank-details` | Delete bank details |

> **Note:** All endpoints require `TELECALLER` role and `ACTIVE` account status.

---

## 🔐 Authorization

All endpoints require:
- Valid JWT token in `Authorization: Bearer <token>` header
- User role must be `TELECALLER`
- Account status must be `ACTIVE`

---

## ✏️ Edit Profile

Edit telecaller profile details.  
**Only available for APPROVED telecallers.**

```
PATCH /telecaller/edit-profile
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
| `name` | `string` | ❌ No | 3-50 characters, letters and spaces only |
| `language` | `string` | ❌ No | Valid language code (see below) |
| `profile` | `string` | ❌ No | `avatar-1` to `avatar-8`, or `null` |
| `about` | `string` | ❌ No | 50-500 characters |

> **Note:** At least one field is required.

#### Supported Languages

`english`, `hindi`, `tamil`, `telugu`, `kannada`, `malayalam`, `bengali`, `marathi`, `gujarati`, `punjabi`, `urdu`, `odia`

#### Available Avatars

`avatar-1`, `avatar-2`, `avatar-3`, `avatar-4`, `avatar-5`, `avatar-6`, `avatar-7`, `avatar-8`

```json
{
  "name": "Jane Updated",
  "language": "tamil",
  "profile": "avatar-5",
  "about": "Professional telecaller with excellent communication skills and 5 years of experience."
}
```

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "phone": "9876543211",
    "name": "Jane Updated",
    "dob": "1992-05-20",
    "gender": "FEMALE",
    "profile": "avatar-5",
    "language": "tamil",
    "accountStatus": "ACTIVE",
    "role": "TELECALLER",
    "wallet": {
      "balance": 500
    },
    "createdAt": "2024-01-10T08:00:00.000Z",
    "telecallerProfile": {
      "about": "Professional telecaller with excellent communication skills...",
      "approvalStatus": "APPROVED",
      "verificationNotes": ""
    }
  }
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | Invalid name format | `"Name can only contain letters and spaces."` |
| `400` | About too short | `"About must be at least 50 characters."` |
| `400` | About too long | `"About cannot exceed 500 characters."` |
| `400` | No fields provided | `"At least one field is required to update."` |
| `400` | Profile incomplete | `"Please complete your profile first."` |
| `400` | Not a telecaller | `"Only telecallers can access this feature."` |
| `401` | Missing token | `"Authentication token is required."` |
| `403` | Not approved | `"You can only edit your profile after your application is approved."` |
| `403` | Account suspended | `"Your account has been suspended. Please contact support."` |
| `403` | Wrong role | `"Access denied. Requires TELECALLER role."` |

### Example

```bash
curl -X PATCH http://localhost:8000/telecaller/edit-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Jane Updated",
    "about": "Professional telecaller with excellent communication skills and 5 years of experience."
  }'
```

---

## 🔄 Reapply

Reapply for telecaller approval after rejection.  
**Only available for REJECTED telecallers.**

```
PATCH /telecaller/reapply
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
| `name` | `string` | ✅ Yes | 3-50 characters, letters and spaces only |
| `dob` | `string` | ✅ Yes | ISO date format, must be 18+ years old |
| `language` | `string` | ✅ Yes | Valid language code |
| `about` | `string` | ✅ Yes | 50-500 characters |

```json
{
  "name": "Jane Smith",
  "dob": "1992-05-20",
  "language": "hindi",
  "about": "I am a professional telecaller with excellent communication skills. I have 5 years of experience in customer support."
}
```

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "message": "Application re-submitted successfully. Please wait for admin approval.",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "phone": "9876543211",
    "name": "Jane Smith",
    "dob": "1992-05-20",
    "gender": "FEMALE",
    "language": "hindi",
    "accountStatus": "ACTIVE",
    "role": "TELECALLER",
    "wallet": {
      "balance": 0
    },
    "telecallerProfile": {
      "about": "I am a professional telecaller with excellent communication skills...",
      "approvalStatus": "PENDING",
      "verificationNotes": "Previously rejected: Incomplete profile information"
    }
  }
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | Name too short | `"Name must be at least 3 characters."` |
| `400` | Under 18 years | `"You must be at least 18 years old."` |
| `400` | Invalid language | `"Please select a valid language."` |
| `400` | About too short | `"About section must be at least 50 characters."` |
| `400` | Not a telecaller | `"Only telecallers can re-apply."` |
| `400` | Not rejected | `"You can only re-apply if your application was rejected."` |
| `401` | Missing token | `"Authentication token is required."` |
| `403` | Account suspended | `"Your account has been suspended. Please contact support."` |
| `403` | Wrong role | `"Access denied. Requires TELECALLER role."` |

### Example

```bash
curl -X PATCH http://localhost:8000/telecaller/reapply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Jane Smith",
    "dob": "1992-05-20",
    "language": "hindi",
    "about": "I am a professional telecaller with excellent communication skills and 5 years of experience."
  }'
```

---

## 🏦 Get Bank Details

Retrieve current bank details for withdrawals.

```
GET /telecaller/bank-details
```

### Request

#### Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <token>` |

### Response

#### ✅ Success `200 OK` - Has Bank Details

```json
{
  "success": true,
  "message": "Bank details retrieved successfully.",
  "data": {
    "accountNumber": "123456789012",
    "ifscCode": "HDFC0001234",
    "accountHolderName": "Jane Smith"
  }
}
```

#### ✅ Success `200 OK` - No Bank Details

```json
{
  "success": true,
  "message": "No bank details found.",
  "data": null
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `401` | Missing token | `"Authentication token is required."` |
| `403` | Wrong role | `"Access denied. Requires TELECALLER role."` |

### Example

```bash
curl -X GET http://localhost:8000/telecaller/bank-details \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🏦 Add Bank Details

Add or update bank details for withdrawals.

```
POST /telecaller/bank-details
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
| `accountNumber` | `string` | ✅ Yes | 9-18 digits only |
| `ifscCode` | `string` | ✅ Yes | Valid IFSC format (`XXXX0XXXXXX`) |
| `accountHolderName` | `string` | ✅ Yes | 3-100 characters, letters and spaces only |

```json
{
  "accountNumber": "123456789012",
  "ifscCode": "HDFC0001234",
  "accountHolderName": "Jane Smith"
}
```

### Response

#### ✅ Success `201 Created`

```json
{
  "success": true,
  "message": "Bank details added successfully.",
  "data": {
    "accountNumber": "123456789012",
    "ifscCode": "HDFC0001234",
    "accountHolderName": "Jane Smith"
  }
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | Invalid account number | `"Account number must be 9-18 digits."` |
| `400` | Invalid IFSC | `"Invalid IFSC code format."` |
| `400` | Invalid holder name | `"Account holder name can only contain letters and spaces."` |
| `401` | Missing token | `"Authentication token is required."` |
| `403` | Wrong role | `"Access denied. Requires TELECALLER role."` |

### Example

```bash
curl -X POST http://localhost:8000/telecaller/bank-details \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "accountNumber": "123456789012",
    "ifscCode": "HDFC0001234",
    "accountHolderName": "Jane Smith"
  }'
```

---

## 🏦 Delete Bank Details

Remove existing bank details.

```
DELETE /telecaller/bank-details
```

### Request

#### Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <token>` |

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "message": "Bank details removed successfully."
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `401` | Missing token | `"Authentication token is required."` |
| `403` | Wrong role | `"Access denied. Requires TELECALLER role."` |
| `404` | Not found | `"Bank details not found."` |

### Example

```bash
curl -X DELETE http://localhost:8000/telecaller/bank-details \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📊 Response Field Reference

### Telecaller Profile Fields

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `_id` | `string` | No | Unique user ID |
| `phone` | `string` | No | Phone number |
| `name` | `string` | No | Telecaller's name |
| `dob` | `string` | No | Date of birth (ISO format) |
| `gender` | `string` | No | `FEMALE` (only females can be telecallers) |
| `profile` | `string` | Yes | Avatar identifier (`avatar-1` to `avatar-8`) |
| `language` | `string` | No | Preferred language code |
| `accountStatus` | `string` | No | `ACTIVE` or `SUSPENDED` |
| `role` | `string` | No | `TELECALLER` |
| `wallet.balance` | `number` | No | Current coin balance |
| `createdAt` | `string` | No | Account creation timestamp (ISO 8601) |

### Telecaller Profile Nested Fields

| Field | Type | Description |
|-------|------|-------------|
| `telecallerProfile.about` | `string` | Telecaller's bio (50-500 chars) |
| `telecallerProfile.approvalStatus` | `string` | `PENDING`, `APPROVED`, or `REJECTED` |
| `telecallerProfile.verificationNotes` | `string` | Admin notes (rejection reason, etc.) |

### Bank Details Fields

| Field | Type | Description |
|-------|------|-------------|
| `accountNumber` | `string` | Bank account number (9-18 digits) |
| `ifscCode` | `string` | IFSC code (format: `XXXX0XXXXXX`) |
| `accountHolderName` | `string` | Account holder's name |

---

## 🔄 Telecaller Approval Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    TELECALLER FLOW                          │
└─────────────────────────────────────────────────────────────┘

1. User registers with role = TELECALLER
   └──► approvalStatus = PENDING

2. Admin reviews application
   ├──► APPROVED → Can go online and receive calls
   └──► REJECTED → Sees rejection reason in verificationNotes

3. If REJECTED, telecaller can reapply
   └──► PATCH /telecaller/reapply
       └──► approvalStatus = PENDING (back to step 2)

4. If APPROVED, telecaller can edit profile
   └──► PATCH /telecaller/edit-profile
```
