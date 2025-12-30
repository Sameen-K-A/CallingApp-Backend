# 👤 Users API

User endpoints for profile management, favorites, and telecaller listings.

---

## 📋 Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| GET | `/users/me` | Get current user profile | Yes |
| PATCH | `/users/complete-profile` | Complete profile setup | Yes |
| PATCH | `/users/edit-profile` | Edit profile details | Yes |
| GET | `/users/plans` | Get available recharge plans | Yes |
| GET | `/users/favorites` | Get favorite telecallers | Yes |
| POST | `/users/favorites/:telecallerId` | Add telecaller to favorites | Yes |
| DELETE | `/users/favorites/:telecallerId` | Remove telecaller from favorites | Yes |
| GET | `/users/telecallers` | Get online, on_call telecallers list with call charges | Yes |

---

## 👤 1. Get My Profile

Get current authenticated user's profile details.

### Get My Profile Endpoint

GET `/users/me`

### Get My Profile Headers

| Header | Value | Required |
| --- | --- | --- |
| Authorization | Bearer {token} | Yes |

### Get My Profile Success Responses

#### Get My Profile Regular User (200)

```json
{
  "success": true,
  "message": "Profile details collected successfully.",
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

#### Get My Profile Telecaller (200)

```json
{
  "success": true,
  "message": "Profile details collected successfully.",
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

### Get My Profile Error Responses

#### Unauthorized (401)

```json
{
  "success": false,
  "message": "Authentication token is required."
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

### Get My Profile Example - cURL

```bash
curl -X GET http://localhost:8000/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## ✏️ 2. Complete Profile

Complete profile setup for new users. Can only be called once.

### Complete Profile Endpoint

PATCH `/users/complete-profile`

### Complete Profile Headers

| Header | Value | Required |
| --- | --- | --- |
| Authorization | Bearer {token} | Yes |

### Complete Profile Request Body

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| name | string | Yes | 3-50 characters |
| dob | string | Yes | ISO date, must be 18+ years old |
| gender | string | Yes | MALE, FEMALE, or OTHER |
| language | string | Yes | Valid language code |
| role | string | Yes | USER or TELECALLER |
| about | string | Conditional | Required if role is TELECALLER, 50-500 characters |

#### Valid Languages

- english
- hindi
- tamil
- telugu
- kannada
- malayalam
- bengali
- marathi
- gujarati
- punjabi
- urdu
- odia

#### Request - Regular User

```json
{
  "name": "John Doe",
  "dob": "1990-01-15",
  "gender": "MALE",
  "language": "english",
  "role": "USER"
}
```

#### Request - Telecaller

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

### Complete Profile Success Responses

#### Complete Profile Regular User (200)

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

#### Complete Profile Telecaller (200)

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

### Complete Profile Error Responses

#### Complete Profile Validation Error (400)

```json
{
  "success": false,
  "message": "Name must be at least 3 characters."
}
```

#### Age Validation (400)

```json
{
  "success": false,
  "message": "You must be at least 18 years old."
}
```

#### Profile Already Completed (400)

```json
{
  "success": false,
  "message": "Profile has already been completed."
}
```

#### Telecaller Gender Restriction (400)

```json
{
  "success": false,
  "message": "Sorry, only female users can register as a telecaller."
}
```

#### About Required for Telecaller (400)

```json
{
  "success": false,
  "message": "About section is required for telecallers."
}
```

### Complete Profile Example - cURL

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

## ✏️ 3. Edit Profile

Edit profile details for existing users. At least one field is required.

### Edit Profile Endpoint

PATCH `/users/edit-profile`

### Edit Profile Headers

| Header | Value | Required |
| --- | --- | --- |
| Authorization | Bearer {token} | Yes |

### Edit Profile Request Body

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| name | string | No | 3-50 characters, letters and spaces only |
| language | string | No | Valid language code |
| profile | string | No | Valid avatar (avatar-1 to avatar-8) or null |

#### Valid Avatars

- avatar-1
- avatar-2
- avatar-3
- avatar-4
- avatar-5
- avatar-6
- avatar-7
- avatar-8

#### Request Example

```json
{
  "name": "John Updated",
  "language": "hindi",
  "profile": "avatar-3"
}
```

### Edit Profile Success Response (200)

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

### Edit Profile Error Responses

#### Validation Error (400)

```json
{
  "success": false,
  "message": "Name can only contain letters and spaces."
}
```

#### No Fields Provided (400)

```json
{
  "success": false,
  "message": "At least one field is required to update."
}
```

#### Profile Not Complete (400)

```json
{
  "success": false,
  "message": "Please complete your profile first."
}
```

### Edit Profile Example - cURL

```bash
curl -X PATCH http://localhost:8000/users/edit-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "John Updated",
    "profile": "avatar-3"
  }'
```

## 💰 4. Get Plans

Get available recharge plans with first-time recharge indicator. This endpoint helps identify if the user is eligible for a first-time recharge offer.

### Get Plans Endpoint

GET `/users/plans`

### Get Plans Headers

| Header | Value | Required |
| --- | --- | --- |
| Authorization | Bearer {token} | Yes |

### Get Plans Success Responses

#### Get Plans Success Response (200)

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

#### Get Plans Empty Response (200)

```json
{
  "success": true,
  "message": "Plans fetched successfully.",
  "data": {
    "plans": [],
    "isFirstRecharge": true
  }
}
```

### Get Plans Response Fields

| Field | Type | Description |
| --- | --- | --- |
| plans | array | List of available recharge plans |
| plans[].\_id | string | Unique plan ID |
| plans[].amount | number | Plan price in currency |
| plans[].coins | number | Coins received with this plan |
| plans[].discountPercentage | number | Discount percentage (0-99) |
| plans[].createdAt | string | Plan creation timestamp |
| isFirstRecharge | boolean | `true` if user has never made a successful recharge, `false` otherwise. Use this to show first-time recharge offers |

### Get Plans Error Responses

#### Feature Not Available (403)

```json
{
  "success": false,
  "message": "This feature is only available for users."
}
```

### Get Plans Example - cURL

```bash
curl -X GET http://localhost:8000/users/plans \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## ⭐ 5. Get Favorites

Get user's favorite telecallers list with pagination.

### Get Favorites Endpoint

GET `/users/favorites`

### Get Favorites Headers

| Header | Value | Required |
| --- | --- | --- |
| Authorization | Bearer {token} | Yes |

### Get Favorites Query Parameters

| Parameter | Type | Default | Rules |
| --- | --- | --- | --- |
| page | number | 1 | Minimum 1 |
| limit | number | 15 | 1-50 |

### Get Favorites Success Responses

#### Get Favorites Success Response (200)

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

#### Get Favorites Empty Response (200)

```json
{
  "success": true,
  "message": "Favorites fetched successfully.",
  "data": {
    "favorites": [],
    "hasMore": false
  }
}
```

### Get Favorites Error Responses

#### Feature Not Available (403)

```json
{
  "success": false,
  "message": "This feature is only available for users."
}
```

### Get Favorites Example - cURL

```bash
curl -X GET "http://localhost:8000/users/favorites?page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## ➕ 6. Add to Favorites

Add a telecaller to favorites list. Maximum 50 favorites allowed.

### Add to Favorites Endpoint

POST `/users/favorites/:telecallerId`

### Add to Favorites Headers

| Header | Value | Required |
| --- | --- | --- |
| Authorization | Bearer {token} | Yes |

### Add to Favorites Path Parameters

| Parameter | Type | Required | Rules |
| --- | --- | --- | --- |
| telecallerId | string | Yes | Valid MongoDB ObjectId |

### Add to Favorites Success Responses

#### Add to Favorites Success Response (200)

```json
{
  "success": true,
  "message": "Added to favorites successfully."
}
```

#### Add to Favorites Already Exists Response (200)

```json
{
  "success": true,
  "message": "Telecaller is already in your favorites."
}
```

### Add to Favorites Error Responses

#### Telecaller Not Found (404)

```json
{
  "success": false,
  "message": "Telecaller not found."
}
```

#### Telecaller Suspended (400)

```json
{
  "success": false,
  "message": "This telecaller is no longer available."
}
```

#### Telecaller Not Approved (400)

```json
{
  "success": false,
  "message": "This telecaller is not available."
}
```

#### Max Limit Reached (400)

```json
{
  "success": false,
  "message": "You have reached the maximum limit of 50 favorites."
}
```

#### Self Add (400)

```json
{
  "success": false,
  "message": "You cannot add yourself to favorites."
}
```

#### Get Favorites Feature Not Available (403)

```json
{
  "success": false,
  "message": "This feature is only available for users."
}
```

### Add to Favorites Example - cURL

```bash
curl -X POST http://localhost:8000/users/favorites/507f1f77bcf86cd799439031 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## ➖ 7. Remove from Favorites

Remove a telecaller from favorites list.

### Remove from Favorites Endpoint

DELETE `/users/favorites/:telecallerId`

### Remove from Favorites Headers

| Header | Value | Required |
| --- | --- | --- |
| Authorization | Bearer {token} | Yes |

### Remove from Favorites Path Parameters

| Parameter | Type | Required | Rules |
| --- | --- | --- | --- |
| telecallerId | string | Yes | Valid MongoDB ObjectId |

### Remove from Favorites Success Response (200)

```json
{
  "success": true,
  "message": "Removed from favorites successfully."
}
```

### Remove from Favorites Error Responses

#### Remove from Favorites Feature Not Available (403)

```json
{
  "success": false,
  "message": "This feature is only available for users."
}
```

### Remove from Favorites Example - cURL

```bash
curl -X DELETE http://localhost:8000/users/favorites/507f1f77bcf86cd799439031 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 📞 8. Get Telecallers

Get list of online/on-call telecallers with pagination and current call charges. Only shows APPROVED telecallers who are ONLINE or ON_CALL. Response includes audio and video call charges per second.

### Get Telecallers Endpoint

GET `/users/telecallers`

### Get Telecallers Headers

| Header | Value | Required |
| --- | --- | --- |
| Authorization | Bearer {token} | Yes |

### Get Telecallers Query Parameters

| Parameter | Type | Default | Rules |
| --- | --- | --- | --- |
| page | number | 1 | Minimum 1 |
| limit | number | 15 | 1-50 |

### Get Telecallers Success Responses

#### Success Response (200)

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

#### Empty Response (200)

```json
{
  "success": true,
  "message": "Telecallers fetched successfully.",
  "data": {
    "data": [],
    "hasMore": false,
    "audioCallCharge": 2,
    "videoCallCharge": 3
  }
}
```

### Get Telecallers Example - cURL

```bash
curl -X GET "http://localhost:8000/users/telecallers?page=1&limit=15" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 📊 Response Fields Reference

### User Profile Fields

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

### Plan Fields

| Field | Type | Description |
| --- | --- | --- |
| _id | string | Unique plan ID |
| amount | number | Price in currency |
| coins | number | Coins received |
| discountPercentage | number | Discount percentage (0-99) |
| createdAt | string | Plan creation timestamp |

### Telecaller List Fields

| Field | Type | Description |
| --- | --- | --- |
| _id | string | Telecaller's user ID |
| name | string | Telecaller's name |
| profile | string | Avatar identifier |
| language | string | Preferred language |
| about | string | Telecaller's bio |
| presence | string | ONLINE, OFFLINE, or ON_CALL |
| isFavorite | boolean | Whether user has favorited (only in telecallers list) |

### Get Telecallers Response Structure

| Field | Type | Description |
| --- | --- | --- |
| data | array | Array of telecaller objects |
| hasMore | boolean | Whether more results are available |
| audioCallCharge | number | Coins charged per second for audio calls |
| videoCallCharge | number | Coins charged per second for video calls |
