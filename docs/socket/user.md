# 🔌 User Socket Events

> Real-time socket events for the user namespace.

---

## 📡 Connection

**Namespace:** `http://localhost:8000/user`

```javascript
const socket = io('http://localhost:8000/user', {
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
});
```

### Requirements

| Requirement | Value |
|-------------|-------|
| Token | Valid JWT token |
| Role | `USER` |
| Account Status | `ACTIVE` |

### Connection Errors

| Error | Cause |
|-------|-------|
| `Authentication token required` | No token provided |
| `Invalid or expired token` | Token validation failed |
| `Access denied` | User role is not `USER` |
| `Account suspended` | Account is blocked |
| `Too many connection attempts` | Rate limited |

---

## 📋 Events Overview

### Client → Server (Emit)

| Event | Description |
|-------|-------------|
| `call:initiate` | Start a call to telecaller |
| `call:cancel` | Cancel outgoing call (while ringing) |
| `call:end` | End active call |

### Server → Client (Listen)

| Event | Description |
|-------|-------------|
| `telecaller:presence-changed` | Telecaller online status changed |
| `call:ringing` | Call is ringing on telecaller side |
| `call:accepted` | Telecaller accepted the call |
| `call:rejected` | Telecaller rejected the call |
| `call:missed` | Call not answered (30s timeout) |
| `call:ended` | Call ended by telecaller |
| `call:error` | Call-related error |
| `error` | General error |

---

## 📞 Call Flows

### ✅ Successful Call

```
User                        Server                      Telecaller
  │                            │                            │
  │  call:initiate             │                            │
  │  {telecallerId, callType}  │                            │
  │───────────────────────────>│                            │
  │                            │  call:incoming             │
  │                            │───────────────────────────>│
  │  call:ringing              │                            │
  │<───────────────────────────│                            │
  │                            │  call:accept               │
  │                            │<───────────────────────────│
  │  call:accepted             │  call:accepted             │
  │  {callId, livekit}         │  {callId, livekit}         │
  │<───────────────────────────│───────────────────────────>│
  │                            │                            │
  │         ⬇️ LiveKit Call Active ⬇️                      │
  │                            │                            │
  │  call:end                  │                            │
  │───────────────────────────>│  call:ended                │
  │                            │───────────────────────────>│
```

### ❌ Rejected / Cancelled / Missed

| Scenario | User Receives | Telecaller Receives |
|----------|---------------|---------------------|
| Telecaller rejects | `call:rejected` | - |
| User cancels | - | `call:cancelled` |
| 30s timeout | `call:missed` | `call:missed` |

---

## 📤 Client → Server Events

### call:initiate

Start a call to a telecaller.

```javascript
socket.emit('call:initiate', {
  telecallerId: '507f1f77bcf86cd799439031',
  callType: 'AUDIO'  // or 'VIDEO'
});
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `telecallerId` | `string` | ✅ Yes | Telecaller's user ID |
| `callType` | `string` | ✅ Yes | `AUDIO` or `VIDEO` |

**Possible Responses:**

| Event | Condition |
|-------|-----------|
| `call:ringing` | Call initiated successfully |
| `call:error` | Failed to initiate |

**Error Messages:**

| Message | Cause |
|---------|-------|
| `Invalid call request` | Missing required fields |
| `Invalid call type` | Not `AUDIO` or `VIDEO` |
| `{name} is currently offline` | Telecaller is offline |
| `{name} is busy on another call` | Telecaller is on a call |
| `You already have an active call` | User has existing call |

---

### call:cancel

Cancel an outgoing call while ringing.

```javascript
socket.emit('call:cancel', {
  callId: '507f1f77bcf86cd799439081'
});
```

| Field | Type | Required |
|-------|------|----------|
| `callId` | `string` | ✅ Yes |

> **Note:** Can only cancel calls in `RINGING` status.

---

### call:end

End an active call.

```javascript
socket.emit('call:end', {
  callId: '507f1f77bcf86cd799439081'
});
```

| Field | Type | Required |
|-------|------|----------|
| `callId` | `string` | ✅ Yes |

> **Note:** Can only end calls in `ACCEPTED` status. Coins are calculated.

---

## 📥 Server → Client Events

### telecaller:presence-changed

Telecaller's online status changed.

```javascript
socket.on('telecaller:presence-changed', (data) => {
  console.log(`${data.telecallerId} is now ${data.presence}`);
});
```

| Field | Type | Description |
|-------|------|-------------|
| `telecallerId` | `string` | Telecaller's user ID |
| `presence` | `string` | `ONLINE`, `OFFLINE`, or `ON_CALL` |
| `telecaller` | `object\|null` | Details (only when `ONLINE`) |

**Example - ONLINE:**

```json
{
  "telecallerId": "507f1f77bcf86cd799439031",
  "presence": "ONLINE",
  "telecaller": {
    "_id": "507f1f77bcf86cd799439031",
    "name": "Jane Smith",
    "profile": "avatar-3",
    "language": "hindi",
    "about": "Experienced telecaller..."
  }
}
```

**Example - OFFLINE/ON_CALL:**

```json
{
  "telecallerId": "507f1f77bcf86cd799439031",
  "presence": "OFFLINE",
  "telecaller": null
}
```

---

### call:ringing

Call is ringing on telecaller's device.

```javascript
socket.on('call:ringing', (data) => {
  showRingingUI(data.telecaller);
});
```

| Field | Type | Description |
|-------|------|-------------|
| `callId` | `string` | Call ID |
| `telecaller._id` | `string` | Telecaller's ID |
| `telecaller.name` | `string` | Telecaller's name |
| `telecaller.profile` | `string\|null` | Avatar |

---

### call:accepted

Telecaller accepted the call. Contains LiveKit credentials.

```javascript
socket.on('call:accepted', (data) => {
  connectToLiveKit(data.livekit);
});
```

| Field | Type | Description |
|-------|------|-------------|
| `callId` | `string` | Call ID |
| `livekit.token` | `string` | LiveKit access token |
| `livekit.url` | `string` | LiveKit server URL |
| `livekit.roomName` | `string` | Room name (= callId) |

```json
{
  "callId": "507f1f77bcf86cd799439081",
  "livekit": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "url": "wss://your-livekit-server.com",
    "roomName": "507f1f77bcf86cd799439081"
  }
}
```

---

### call:rejected

Telecaller rejected the call.

```javascript
socket.on('call:rejected', (data) => {
  showRejectedMessage();
});
```

| Field | Type |
|-------|------|
| `callId` | `string` |

---

### call:missed

Call was not answered within 30 seconds.

```javascript
socket.on('call:missed', (data) => {
  showMissedCallUI();
});
```

| Field | Type |
|-------|------|
| `callId` | `string` |

---

### call:ended

Call ended by telecaller.

```javascript
socket.on('call:ended', (data) => {
  disconnectFromLiveKit();
});
```

| Field | Type |
|-------|------|
| `callId` | `string` |

---

### call:error

Call-related error occurred.

```javascript
socket.on('call:error', (data) => {
  showError(data.message);
});
```

| Field | Type |
|-------|------|
| `message` | `string` |

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

---

## ⏱️ Rate Limits

| Action | Limit |
|--------|-------|
| `call:initiate` | 5 per minute |
| `call:cancel` | 20 per minute |
| `call:end` | 20 per minute |
| Connection | 10 per minute per IP |

---

## 🔌 Disconnect Handling

| Call Status | Action |
|-------------|--------|
| `RINGING` | Call marked as `MISSED`, telecaller notified |
| `ACCEPTED` | Call marked as `COMPLETED`, telecaller notified, LiveKit room destroyed |
