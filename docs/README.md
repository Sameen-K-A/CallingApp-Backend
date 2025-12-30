# 📞 Calling-App API Documentation

> Backend API documentation for **Calling-App** — a calling platform connecting users with telecallers.

---

## 🌐 Base URL

| Environment | URL |
|-------------|-----|
| Local | `http://localhost:8000` |
| Production | TBD |

---

## 🔐 Authentication

Most endpoints require JWT token authentication.

| Client | Method |
|--------|--------|
| Flutter App | `Authorization: Bearer <token>` header |
| Admin Panel | `authenticationToken` httpOnly cookie |

---

## 📦 Response Format

### Success Response

```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message"
}
```

---

## 📡 HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (missing/invalid token) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Not Found |
| `429` | Too Many Requests (rate limited) |
| `500` | Internal Server Error |

---

## 📚 API Modules

| Module | Description | Documentation |
|--------|-------------|---------------|
| 🔐 Auth | OTP send, resend, verify | [auth.md](./auth.md) |
| 👤 Users | Profile, favorites, telecallers list, plans | [users.md](./users.md) |
| 📞 Telecaller | Profile edit, reapply, bank details | [telecaller.md](./telecaller.md) |
| 💳 Payment | Recharge, withdrawal | [payment.md](./payment.md) |
| 🛡️ Admin | Dashboard, user/telecaller/transaction management | [admin.md](./admin.md) |

### 🔌 Socket Events (Real-time)

| Namespace | Description | Documentation |
|-----------|-------------|---------------|
| `/user` | User call events | [socket/user.md](./socket/user.md) |
| `/telecaller` | Telecaller call events | [socket/telecaller.md](./socket/telecaller.md) |
| `/admin` | Admin presence events | [socket/admin.md](./socket/admin.md) |

---

## 👥 User Roles

| Role | Description | Access |
|------|-------------|--------|
| `USER` | Regular user | Makes calls, recharges coins |
| `TELECALLER` | Service provider | Receives calls, withdraws earnings |
| `ADMIN` | Administrator | Full admin panel access |

---

## 🔒 Account Status

| Status | Description |
|--------|-------------|
| `ACTIVE` | Full access to all features |
| `SUSPENDED` | Account blocked, contact support |

---

## 📞 Telecaller Approval Status

| Status | Description |
|--------|-------------|
| `PENDING` | Application submitted, awaiting review |
| `APPROVED` | Can go online and receive calls |
| `REJECTED` | Application rejected, can reapply |

---

## 🚀 Getting Started

1. **Authentication**: Use `/auth/send` → `/auth/verify` to get JWT token
2. **Profile Setup**: Complete profile via `/users/complete-profile`
3. **Start Using**: 
   - **Users**: Browse telecallers, recharge coins, make calls
   - **Telecallers**: Wait for approval, go online, receive calls
