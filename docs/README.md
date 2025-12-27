# 📞 Calling-App API Documentation

Backend API documentation for **Calling-App** — a calling platform connecting users with telecallers.

---

## 🌐 Base URL

| Environment | URL |
| --- | --- |
| Local | <http://localhost:8000> |
| Production | TBD |

---

## 🔐 Authentication

Most endpoints require JWT token authentication.

### Client Authentication Methods

| Client | Method |
| --- | --- |
| Flutter App | Authorization: Bearer {token} header |
| Admin Panel | authenticationToken (httpOnly cookie) |

---

## 📦 Response Format

### Success Response

{
  "success": true,
  "message": "Success message",
  "data": {}
}

### Error Response

{
  "success": false,
  "message": "Error message"
}

---

## 📡 HTTP Status Codes

| Code | Meaning |
| --- | --- |
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## 🧩 API Modules

| Module | Description | File |
| --- | --- | --- |
| Auth | OTP send, resend, verify | auth.md |
| Users | Profile, favorites, telecallers list | users.md |
| Telecaller | Profile edit, reapply | telecaller.md |
| Admin | Dashboard, management | admin.md |
| Socket | Real-time call events | socket-events.md |

---

## 👥 User Roles

| Role | Description |
| --- | --- |
| USER | Makes calls to telecallers |
| TELECALLER | Receives calls from users |
| ADMIN | Admin panel access |

---

## 🔒 Account Status

| Status | Description |
| --- | --- |
| ACTIVE | Full access |
| SUSPENDED | Blocked |

---

## 📞 Telecaller Approval Status

| Status | Description |
| --- | --- |
| PENDING | Awaiting approval |
| APPROVED | Can receive calls |
| REJECTED | Can reapply |
