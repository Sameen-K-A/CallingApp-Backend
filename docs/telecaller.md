# 📞 Telecaller API

Telecaller endpoints for profile management and reapplication.

---

## 📋 Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| PATCH | `/telecaller/edit-profile` | Edit telecaller profile | Yes (TELECALLER) |
| PATCH | `/telecaller/reapply` | Reapply after rejection | Yes (TELECALLER) |
| GET | `/telecaller/bank-details` | Get bank details | Yes (TELECALLER) |
| POST | `/telecaller/bank-details` | Add bank details | Yes (TELECALLER) |
| DELETE | `/telecaller/bank-details` | Delete bank details | Yes (TELECALLER) |

---

## 🔐 Authorization

All endpoints require:

- Valid JWT token
- User role must be `TELECALLER`
- Account status must be `ACTIVE`

---

## ✏️ 1. Edit Profile

Edit telecaller profile details. Only available for APPROVED telecallers.

### Edit Profile Endpoint

PATCH `/telecaller/edit-profile`

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
| about | string | No | 50-500 characters |

At least one field is required.

#### Edit Profile Valid Languages

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

#### Edit Profile Valid Avatars

- avatar-1
- avatar-2
- avatar-3
- avatar-4
- avatar-5
- avatar-6
- avatar-7
- avatar-8

#### Edit Profile Request Example

```json
{
  "name": "Jane Updated",
  "language": "tamil",
  "profile": "avatar-5",
  "about": "Professional telecaller with excellent communication skills and 5 years of experience in customer support."
}
```

### Edit Profile Success Response (200)

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
      "about": "Professional telecaller with excellent communication skills and 5 years of experience in customer support.",
      "approvalStatus": "APPROVED",
      "verificationNotes": ""
    }
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

#### About Too Short (400)

```json
{
  "success": false,
  "message": "About must be at least 50 characters."
}
```

#### About Too Long (400)

```json
{
  "success": false,
  "message": "About cannot exceed 500 characters."
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

#### Edit Profile Not a Telecaller (400)

```json
{
  "success": false,
  "message": "Only telecallers can access this feature."
}
```

#### Edit Profile Not Approved (403)

```json
{
  "success": false,
  "message": "You can only edit your profile after your application is approved."
}
```

#### Edit Profile Account Suspended (403)

```json
{
  "success": false,
  "message": "Your account has been suspended. Please contact support."
}
```

#### Edit Profile Unauthorized (401)

```json
{
  "success": false,
  "message": "Authentication token is required."
}
```

#### Edit Profile Access Denied (403)

```json
{
  "success": false,
  "message": "Access denied. Requires TELECALLER role."
}
```

### Edit Profile Example - cURL

```bash
curl -X PATCH http://localhost:8000/telecaller/edit-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Jane Updated",
    "about": "Professional telecaller with excellent communication skills and 5 years of experience in customer support."
  }'
```

## 🔄 2. Reapply

Reapply for telecaller approval after rejection. Only available for REJECTED telecallers.

### Reapply Endpoint

PATCH `/telecaller/reapply`

### Reapply Headers

| Header | Value | Required |
| --- | --- | --- |
| Authorization | Bearer {token} | Yes |

### Reapply Request Body

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| name | string | Yes | 3-50 characters, letters and spaces only |
| dob | string | Yes | ISO date, must be 18+ years old |
| language | string | Yes | Valid language code |
| about | string | Yes | 50-500 characters |

#### Reapply Valid Languages

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

#### Reapply Request Example

```json
{
  "name": "Jane Smith",
  "dob": "1992-05-20",
  "language": "hindi",
  "about": "I am a professional telecaller with excellent communication skills. I have 5 years of experience in customer support and I am dedicated to providing quality service."
}
```

### Reapply Success Response (200)

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
    "profile": "avatar-3",
    "language": "hindi",
    "accountStatus": "ACTIVE",
    "role": "TELECALLER",
    "wallet": {
      "balance": 0
    },
    "createdAt": "2024-01-10T08:00:00.000Z",
    "telecallerProfile": {
      "about": "I am a professional telecaller with excellent communication skills. I have 5 years of experience in customer support and I am dedicated to providing quality service.",
      "approvalStatus": "PENDING",
      "verificationNotes": "Previously rejected: Incomplete profile information"
    }
  }
}
```

### Reapply Error Responses

#### Validation Error - Name (400)

```json
{
  "success": false,
  "message": "Name must be at least 3 characters."
}
```

#### Validation Error - DOB (400)

```json
{
  "success": false,
  "message": "You must be at least 18 years old."
}
```

#### Validation Error - Language (400)

```json
{
  "success": false,
  "message": "Please select a valid language."
}
```

#### Validation Error - About (400)

```json
{
  "success": false,
  "message": "About section must be at least 50 characters."
}
```

#### Reapply Not a Telecaller (400)

```json
{
  "success": false,
  "message": "Only telecallers can re-apply."
}
```

#### Reapply Not Rejected (400)

```json
{
  "success": false,
  "message": "You can only re-apply if your application was rejected."
}
```

#### Reapply Account Suspended (403)

```json
{
  "success": false,
  "message": "Your account has been suspended. Please contact support."
}
```

#### Reapply Unauthorized (401)

```json
{
  "success": false,
  "message": "Authentication token is required."
}
```

#### Reapply Access Denied (403)

```json
{
  "success": false,
  "message": "Access denied. Requires TELECALLER role."
}
```

### Reapply Example - cURL

```bash
curl -X PATCH http://localhost:8000/telecaller/reapply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Jane Smith",
    "dob": "1992-05-20",
    "language": "hindi",
    "about": "I am a professional telecaller with excellent communication skills. I have 5 years of experience in customer support and I am dedicated to providing quality service."
  }'
```

## 🏦 3. Bank Details Management

Manage telecaller bank details for payments and withdrawals.

### Get Bank Details

Retrieve current bank details.

#### Get Bank Details Endpoint

```text
GET /telecaller/bank-details
```

#### Get Bank Details Headers

| Header | Value | Required |
| --- | --- | --- |
| Authorization | Bearer {token} | Yes |

#### Get Bank Details Success Response (200)

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

#### Get Bank Details Success Response - No Details (200)

```json
{
  "success": true,
  "message": "No bank details found.",
  "data": null
}
```

#### Get Bank Details Error Responses

##### Unauthorized (401)

```json
{
  "success": false,
  "message": "Authentication token is required."
}
```

##### Access Denied (403)

```json
{
  "success": false,
  "message": "Access denied. Requires TELECALLER role."
}
```

#### Get Bank Details Example - cURL

```bash
curl -X GET http://localhost:8000/telecaller/bank-details \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Add Bank Details

Add or update bank details for the telecaller.

#### Add Bank Details Endpoint

```text
POST /telecaller/bank-details
```

#### Add Bank Details Headers

| Header | Value | Required |
| --- | --- | --- |
| Authorization | Bearer {token} | Yes |
| Content-Type | application/json | Yes |

#### Add Bank Details Request Body

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| accountNumber | string | Yes | 9-18 digits only |
| ifscCode | string | Yes | Valid IFSC format (XXXX0XXXXXX) |
| accountHolderName | string | Yes | 3-100 characters, letters and spaces only |

#### Add Bank Details Request Example

```json
{
  "accountNumber": "123456789012",
  "ifscCode": "HDFC0001234",
  "accountHolderName": "Jane Smith"
}
```

#### Add Bank Details Success Response (201)

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

#### Add Bank Details Error Responses

##### Validation Error - Invalid Account Number (400)

```json
{
  "success": false,
  "message": "Account number must be 9-18 digits."
}
```

##### Validation Error - Invalid IFSC Code (400)

```json
{
  "success": false,
  "message": "Invalid IFSC code format."
}
```

##### Validation Error - Invalid Account Holder Name (400)

```json
{
  "success": false,
  "message": "Account holder name can only contain letters and spaces."
}
```

##### Add Bank Details - Unauthorized (401)

```json
{
  "success": false,
  "message": "Authentication token is required."
}
```

##### Add Bank Details - Access Denied (403)

```json
{
  "success": false,
  "message": "Access denied. Requires TELECALLER role."
}
```

#### Add Bank Details Example - cURL

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

### Delete Bank Details

Remove existing bank details.

#### Delete Bank Details Endpoint

```text
DELETE /telecaller/bank-details
```

#### Delete Bank Details Headers

| Header | Value | Required |
| --- | --- | --- |
| Authorization | Bearer {token} | Yes |

#### Delete Bank Details Success Response (200)

```json
{
  "success": true,
  "message": "Bank details removed successfully."
}
```

#### Delete Bank Details Error Responses

##### Delete Bank Details - Bank Details Not Found (404)

```json
{
  "success": false,
  "message": "Bank details not found."
}
```

##### Delete Bank Details - Unauthorized (401)

```json
{
  "success": false,
  "message": "Authentication token is required."
}
```

##### Delete Bank Details - Access Denied (403)

```json
{
  "success": false,
  "message": "Access denied. Requires TELECALLER role."
}
```

#### Delete Bank Details Example - cURL

```bash
curl -X DELETE http://localhost:8000/telecaller/bank-details \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 📊 Response Fields Reference

### Telecaller Profile Fields

| Field | Type | Nullable | Description |
| --- | --- | --- | --- |
| _id | string | No | Unique user ID |
| phone | string | No | Phone number |
| name | string | No | Telecaller's name |
| dob | date | No | Date of birth |
| gender | string | No | FEMALE (only females can be telecallers) |
| profile | string | Yes | Avatar identifier |
| language | string | No | Preferred language |
| accountStatus | string | No | ACTIVE or SUSPENDED |
| role | string | No | TELECALLER |
| wallet.balance | number | No | Current wallet balance |
| createdAt | string | No | Account creation timestamp |
| telecallerProfile.about | string | No | Telecaller's bio |
| telecallerProfile.approvalStatus | string | No | PENDING, APPROVED, or REJECTED |
| telecallerProfile.verificationNotes | string | Yes | Admin notes (rejection reason, etc.) |

## 🔄 Telecaller Approval Flow

```text
┌─────────────────────────────────────────────────────────────┐
│                    TELECALLER FLOW                          │
└─────────────────────────────────────────────────────────────┘

1. User registers and completes profile with role=TELECALLER
   └──► approvalStatus = PENDING

2. Admin reviews application
   ├──► APPROVED: Telecaller can go online and receive calls
   └──► REJECTED: Telecaller sees rejection reason

3. If REJECTED, telecaller can reapply
   └──► PATCH /telecaller/reapply
       └──► approvalStatus = PENDING (back to step 2)

4. If APPROVED, telecaller can edit profile
   └──► PATCH /telecaller/edit-profile
```
