# 🛡️ Admin Socket Events

> Real-time socket events for the admin namespace.

---

## 📡 Connection

**Namespace:** `http://localhost:8000/admin`

```javascript
const socket = io('http://localhost:8000/admin', {
  withCredentials: true  // Required for cookie authentication
});
```

### Requirements

| Requirement | Value |
|-------------|-------|
| Cookie | Valid `authenticationToken` cookie |
| Role | `ADMIN` |

### Connection Errors

| Error | Cause |
|-------|-------|
| `Authentication token required` | No cookie found |
| `Invalid or expired token` | Token expired |
| `Access denied` | Role is not `ADMIN` |

---

## 📋 Events Overview

### Client → Server (Emit)

| Event | Description |
|-------|-------------|
| `presence:request-counts` | Request online user/telecaller counts |

### Server → Client (Listen)

| Event | Description |
|-------|-------------|
| `presence:counts` | Response with online counts |
| `error` | General error |

---

## 📤 Client → Server Events

### presence:request-counts

Request current online statistics.

```javascript
socket.emit('presence:request-counts');
```

**Response:**
- ✅ Success → `presence:counts` event
- ❌ Failure → `error` event

---

## 📥 Server → Client Events

### presence:counts

Contains current online statistics.

```javascript
socket.on('presence:counts', (data) => {
  console.log(`Users: ${data.onlineUsers}, Telecallers: ${data.onlineTelecallers}`);
});
```

| Field | Type | Description |
|-------|------|-------------|
| `onlineUsers` | `number` | Count of connected users |
| `onlineTelecallers` | `number` | Count of connected telecallers |
| `timestamp` | `string` | ISO timestamp of snapshot |

```json
{
  "onlineUsers": 142,
  "onlineTelecallers": 28,
  "timestamp": "2024-01-19T10:30:00.000Z"
}
```

---

### error

General socket error.

```javascript
socket.on('error', (data) => {
  console.error(data.message);
});
```

| Field | Type |
|-------|------|
| `message` | `string` |

```json
{
  "message": "Failed to fetch presence counts"
}
```
