# 👤 Users API

> User endpoints for profile management, favorites, and telecaller listings.

---

## 📋 Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users/me` | Get current user profile |
| `PATCH` | `/users/complete-profile` | Complete profile setup |
| `PATCH` | `/users/edit-profile` | Edit profile details |
| `GET` | `/users/plans` | Get available recharge plans |
| `GET` | `/users/favorites` | Get favorite telecallers |
| `POST` | `/users/favorites/:telecallerId` | Add telecaller to favorites |
| `DELETE` | `/users/favorites/:telecallerId` | Remove telecaller from favorites |
| `GET` | `/users/telecallers` | Get online telecallers with call charges |

> **Note:** All endpoints require authentication via `Authorization: Bearer <token>` header.

---

## 👤 Get My Profile

Get the current authenticated user's profile details.

```
GET /users/me
```

### Request

#### Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <token>` |

### Response

#### ✅ Success `200 OK`

---

**👤 Regular User**

```json
{
  "success": true,
  "message": "collect profile details successfully.",
  "data": {
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

**📞 Telecaller**

```json
{
  "success": true,
  "message": "collect profile details successfully.",
  "data": {
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
      "verificationNotes": ""
    }
  }
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `401` | Missing token | `"Authentication token is required."` |
| `403` | Account suspended | `"Your account has been suspended. Please contact support."` |
| `404` | User not found | `"User not found."` |

### Example

```bash
curl -X GET http://localhost:8000/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## ✏️ Complete Profile

Complete profile setup for new users.  
**Can only be called once** - returns error if profile already completed.

```
PATCH /users/complete-profile
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
| `name` | `string` | ✅ Yes | 3-50 characters |
| `dob` | `string` | ✅ Yes | ISO date format, must be 18+ years old |
| `gender` | `string` | ✅ Yes | `MALE`, `FEMALE`, or `OTHER` |
| `language` | `string` | ✅ Yes | Valid language code (see below) |
| `role` | `string` | ✅ Yes | `USER` or `TELECALLER` |
| `about` | `string` | Conditional | Required if `role` is `TELECALLER`, 50-500 characters |

#### Supported Languages

| Code | Language |
|------|----------|
| `english` | English |
| `hindi` | हिंदी |
| `tamil` | தமிழ் |
| `telugu` | తెలుగు |
| `kannada` | ಕನ್ನಡ |
| `malayalam` | മലയാളം |
| `bengali` | বাংলা |
| `marathi` | मराठी |
| `gujarati` | ગુજરાતી |
| `punjabi` | ਪੰਜਾਬੀ |
| `urdu` | اردو |
| `odia` | ଓଡ଼ିଆ |

---

**Request - Regular User**

```json
{
  "name": "John Doe",
  "dob": "1990-01-15",
  "gender": "MALE",
  "language": "english",
  "role": "USER"
}
```

---

**Request - Telecaller**

```json
{
  "name": "Jane Smith",
  "dob": "1992-05-20",
  "gender": "FEMALE",
  "language": "hindi",
  "role": "TELECALLER",
  "about": "Experienced telecaller with 5 years of experience in customer support and communication."
}
```

### Response

#### ✅ Success `200 OK`

---

**👤 Regular User**

```json
{
  "success": true,
  "message": "Profile setup completed successfully.",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "phone": "9876543210",
    "name": "John Doe",
    "dob": "1990-01-15",
    "gender": "MALE",
    "language": "english",
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

**📞 Telecaller** *(approval status will be PENDING)*

```json
{
  "success": true,
  "message": "Profile setup completed successfully.",
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
    "createdAt": "2024-01-10T08:00:00.000Z",
    "telecallerProfile": {
      "about": "Experienced telecaller with 5 years of experience in customer support and communication.",
      "approvalStatus": "PENDING",
      "verificationNotes": ""
    }
  }
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | Name too short | `"Name must be at least 3 characters."` |
| `400` | Under 18 years old | `"You must be at least 18 years old."` |
| `400` | Profile already completed | `"Profile has already been completed."` |
| `400` | Gender restriction | `"Sorry, only female users can register as a telecaller."` |
| `400` | Missing about for telecaller | `"About section is required for telecallers."` |

### Example

```bash
curl -X PATCH http://localhost:8000/users/complete-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "John Doe",
    "dob": "1990-01-15",
    "gender": "MALE",
    "language": "english",
    "role": "USER"
  }'
```

---

## ✏️ Edit Profile

Edit profile details for existing users.  
**At least one field is required.**

```
PATCH /users/edit-profile
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
| `language` | `string` | ❌ No | Valid language code |
| `profile` | `string` | ❌ No | Valid avatar or `null` to remove |

#### Available Avatars

`avatar-1`, `avatar-2`, `avatar-3`, `avatar-4`, `avatar-5`, `avatar-6`, `avatar-7`, `avatar-8`

```json
{
  "name": "John Updated",
  "language": "hindi",
  "profile": "avatar-3"
}
```

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "phone": "9876543210",
    "name": "John Updated",
    "dob": "1990-01-15",
    "gender": "MALE",
    "profile": "avatar-3",
    "language": "hindi",
    "accountStatus": "ACTIVE",
    "role": "USER",
    "wallet": {
      "balance": 150
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | Invalid name format | `"Name can only contain letters and spaces."` |
| `400` | No fields provided | `"At least one field is required to update."` |
| `400` | Profile not complete | `"Please complete your profile first."` |

### Example

```bash
curl -X PATCH http://localhost:8000/users/edit-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "John Updated",
    "profile": "avatar-3"
  }'
```

---

## 💰 Get Plans

Get available recharge plans with first-time recharge indicator.  
**Use `isFirstRecharge` to show special first-time offers.**

```
GET /users/plans
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
  "message": "Plans fetched successfully.",
  "data": {
    "plans": [
      {
        "_id": "507f1f77bcf86cd799439021",
        "amount": 99,
        "coins": 100,
        "discountPercentage": 0,
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439022",
        "amount": 199,
        "coins": 220,
        "discountPercentage": 10,
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439023",
        "amount": 499,
        "coins": 600,
        "discountPercentage": 20,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "isFirstRecharge": true
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `plans` | `array` | List of available recharge plans |
| `plans[]._id` | `string` | Unique plan ID |
| `plans[].amount` | `number` | Plan price in currency |
| `plans[].coins` | `number` | Coins received with this plan |
| `plans[].discountPercentage` | `number` | Discount percentage (0-99) |
| `isFirstRecharge` | `boolean` | `true` = user never recharged, `false` = has recharged before |

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `403` | Telecaller access | `"This feature is only available for users."` |

### Example

```bash
curl -X GET http://localhost:8000/users/plans \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## ⭐ Get Favorites

Get user's favorite telecallers list with pagination.

```
GET /users/favorites
```

### Request

#### Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <token>` |

#### Query Parameters

| Parameter | Type | Default | Validation |
|-----------|------|---------|------------|
| `page` | `number` | `1` | Minimum: 1 |
| `limit` | `number` | `15` | Range: 1-50 |

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "message": "Favorites fetched successfully.",
  "data": {
    "favorites": [
      {
        "_id": "507f1f77bcf86cd799439031",
        "name": "Jane Smith",
        "profile": "avatar-3",
        "language": "hindi",
        "about": "Experienced telecaller with 5 years of experience.",
        "presence": "ONLINE"
      },
      {
        "_id": "507f1f77bcf86cd799439032",
        "name": "Sara Jones",
        "profile": "avatar-5",
        "language": "english",
        "about": "Friendly and professional telecaller.",
        "presence": "OFFLINE"
      }
    ],
    "hasMore": false
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `favorites` | `array` | List of favorite telecallers |
| `favorites[].presence` | `string` | `ONLINE`, `OFFLINE`, or `ON_CALL` |
| `hasMore` | `boolean` | `true` if more pages available |

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `403` | Telecaller access | `"This feature is only available for users."` |

### Example

```bash
curl -X GET "http://localhost:8000/users/favorites?page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## ➕ Add to Favorites

Add a telecaller to favorites list.  
**Maximum 50 favorites allowed per user.**

```
POST /users/favorites/:telecallerId
```

### Request

#### Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <token>` |

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `telecallerId` | `string` | Telecaller's user ID (MongoDB ObjectId) |

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "message": "Added to favorites successfully."
}
```

**Already in favorites:**

```json
{
  "success": true,
  "message": "Telecaller is already in your favorites."
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `400` | Self-add attempt | `"You cannot add yourself to favorites."` |
| `400` | Max limit reached | `"You have reached the maximum limit of 50 favorites."` |
| `400` | Telecaller suspended | `"This telecaller is no longer available."` |
| `400` | Telecaller not approved | `"This telecaller is not available."` |
| `403` | Telecaller access | `"This feature is only available for users."` |
| `404` | Telecaller not found | `"Telecaller not found."` |

### Example

```bash
curl -X POST http://localhost:8000/users/favorites/507f1f77bcf86cd799439031 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## ➖ Remove from Favorites

Remove a telecaller from favorites list.

```
DELETE /users/favorites/:telecallerId
```

### Request

#### Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <token>` |

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `telecallerId` | `string` | Telecaller's user ID (MongoDB ObjectId) |

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "message": "Removed from favorites successfully."
}
```

#### ❌ Errors

| Status | Scenario | Response |
|--------|----------|----------|
| `403` | Telecaller access | `"This feature is only available for users."` |

### Example

```bash
curl -X DELETE http://localhost:8000/users/favorites/507f1f77bcf86cd799439031 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📞 Get Telecallers

Get list of available telecallers for calling.  
**Only shows APPROVED telecallers who are ONLINE or ON_CALL.**

```
GET /users/telecallers
```

### Request

#### Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <token>` |

#### Query Parameters

| Parameter | Type | Default | Validation |
|-----------|------|---------|------------|
| `page` | `number` | `1` | Minimum: 1 |
| `limit` | `number` | `15` | Range: 1-50 |

### Response

#### ✅ Success `200 OK`

```json
{
  "success": true,
  "message": "Telecallers fetched successfully.",
  "data": {
    "data": [
      {
        "_id": "507f1f77bcf86cd799439031",
        "name": "Jane Smith",
        "profile": "avatar-3",
        "language": "hindi",
        "about": "Experienced telecaller with 5 years of experience.",
        "presence": "ONLINE",
        "isFavorite": true
      },
      {
        "_id": "507f1f77bcf86cd799439032",
        "name": "Sara Jones",
        "profile": "avatar-5",
        "language": "english",
        "about": "Friendly and professional telecaller.",
        "presence": "ON_CALL",
        "isFavorite": false
      }
    ],
    "hasMore": true,
    "audioCallCharge": 2,
    "videoCallCharge": 3
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `data` | `array` | List of telecaller objects |
| `data[].presence` | `string` | `ONLINE` or `ON_CALL` |
| `data[].isFavorite` | `boolean` | Whether user has favorited this telecaller |
| `hasMore` | `boolean` | `true` if more pages available |
| `audioCallCharge` | `number` | Coins charged per second for audio calls |
| `videoCallCharge` | `number` | Coins charged per second for video calls |

### Example

```bash
curl -X GET "http://localhost:8000/users/telecallers?page=1&limit=15" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📊 Response Field Reference

### User Profile Fields

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `_id` | `string` | No | Unique user ID |
| `phone` | `string` | No | Phone number |
| `name` | `string` | **Yes** | User's name (`null` if profile not completed) |
| `dob` | `string` | Yes | Date of birth (ISO format) |
| `gender` | `string` | Yes | `MALE`, `FEMALE`, or `OTHER` |
| `profile` | `string` | Yes | Avatar identifier (e.g., `avatar-1`) |
| `language` | `string` | Yes | Preferred language code |
| `accountStatus` | `string` | No | `ACTIVE` or `SUSPENDED` |
| `role` | `string` | No | `USER` or `TELECALLER` |
| `wallet.balance` | `number` | No | Current coin balance |
| `createdAt` | `string` | No | Account creation timestamp (ISO 8601) |

### Telecaller Profile Fields

Only present when `role === "TELECALLER"`:

| Field | Type | Description |
|-------|------|-------------|
| `telecallerProfile.about` | `string` | Telecaller's bio/description |
| `telecallerProfile.approvalStatus` | `string` | `PENDING`, `APPROVED`, or `REJECTED` |
| `telecallerProfile.verificationNotes` | `string` | Admin verification notes |

### Plan Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `_id` | `string` | Unique plan ID |
| `amount` | `number` | Price in currency |
| `coins` | `number` | Coins received |
| `discountPercentage` | `number` | Discount percentage (0-99) |
| `createdAt` | `string` | Plan creation timestamp |

### Telecaller List Item Fields

| Field | Type | Description |
|-------|------|-------------|
| `_id` | `string` | Telecaller's user ID |
| `name` | `string` | Telecaller's name |
| `profile` | `string` | Avatar identifier |
| `language` | `string` | Preferred language |
| `about` | `string` | Telecaller's bio |
| `presence` | `string` | `ONLINE`, `OFFLINE`, or `ON_CALL` |
| `isFavorite` | `boolean` | Whether user has favorited (only in telecallers list) |
