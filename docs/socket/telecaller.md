# 🔌 Telecaller Socket Events

> Real-time socket events for the telecaller namespace.

---

## 📡 Connection

**Namespace:** `http://localhost:8000/telecaller`

```javascript
const socket = io('http://localhost:8000/telecaller', {
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
});
```

### Requirements

| Requirement | Value |
|-------------|-------|
| Token | Valid JWT token |
| Role | `TELECALLER` |
| Account Status | `ACTIVE` |
| Approval Status | `APPROVED` |

### Connection Errors

| Error | Cause |
|-------|-------|
| `Authentication token required` | No token provided |
| `Invalid or expired token` | Token validation failed |
| `Access denied` | User role is not `TELECALLER` |
| `Account suspended` | Account is blocked |
| `Account not approved` | Profile pending or rejected |
| `Too many connection attempts` | Rate limited |

---

## 📋 Events Overview

### Client → Server (Emit)

| Event | Description |
|-------|-------------|
| `call:accept` | Accept an incoming call |
| `call:reject` | Reject an incoming call |
| `call:end` | End active call |

### Server → Client (Listen)

| Event | Description |
|-------|-------------|
| `call:incoming` | New call request from user |
| `call:accepted` | Confirmation with LiveKit credentials |
| `call:missed` | Call not answered (30s timeout) |
| `call:cancelled` | User cancelled call |
| `call:ended` | Call ended by user |
| `error` | General error |

---

## 📞 Call Flows

### Incoming Call

```
User                        Server                      Telecaller
  │  call:initiate             │                            │
  │───────────────────────────>│                            │
  │                            │  call:incoming             │
  │                            │  {callId, callType, caller}│
  │                            │───────────────────────────>│
  │                            │                            │
  │                            │     📱 UI Rings 📱        │
```

### Accept Call

```
  │                            │  call:accept               │
  │                            │  {callId}                  │
  │                            │<───────────────────────────│
  │  call:accepted             │  call:accepted             │
  │  {callId, livekit}         │  {callId, livekit}         │
  │<───────────────────────────│───────────────────────────>│
  │                            │                            │
  │         ⬇️ LiveKit Call Active ⬇️                      │
```

---

## 📥 Server → Client Events

### call:incoming

A user is calling you.

```javascript
socket.on('call:incoming', (data) => {
  showIncomingCallScreen(data);
});
```

| Field | Type | Description |
|-------|------|-------------|
| `callId` | `string` | Unique call ID |
| `callType` | `string` | `AUDIO` or `VIDEO` |
| `caller._id` | `string` | User ID |
| `caller.name` | `string` | User name |
| `caller.profile` | `string\|null` | Avatar |

```json
{
  "callId": "507f1f77bcf86cd799439081",
  "callType": "AUDIO",
  "caller": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "profile": "avatar-1"
  }
}
```

---

### call:accepted

Confirmation that call was accepted. Contains LiveKit credentials.

```javascript
socket.on('call:accepted', (data) => {
  connectToLiveKit(data.livekit);
});
```

| Field | Type | Description |
|-------|------|-------------|
| `callId` | `string` | Call ID |
| `callType` | `string` | `AUDIO` or `VIDEO` |
| `caller` | `object` | User details |
| `livekit.token` | `string` | LiveKit access token |
| `livekit.url` | `string` | LiveKit server URL |
| `livekit.roomName` | `string` | Room name (= callId) |

```json
{
  "callId": "507f1f77bcf86cd799439081",
  "callType": "AUDIO",
  "caller": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "profile": "avatar-1"
  },
  "livekit": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "url": "wss://your-livekit-server.com",
    "roomName": "507f1f77bcf86cd799439081"
  }
}
```

---

### call:missed

Call timed out (30 seconds) - you didn't answer.

```javascript
socket.on('call:missed', (data) => {
  hideIncomingCallScreen();
  showMissedCallNotification();
});
```

| Field | Type |
|-------|------|
| `callId` | `string` |

---

### call:cancelled

User cancelled the call before you answered.

```javascript
socket.on('call:cancelled', (data) => {
  hideIncomingCallScreen();
});
```

| Field | Type |
|-------|------|
| `callId` | `string` |

---

### call:ended

User hung up the active call.

```javascript
socket.on('call:ended', (data) => {
  disconnectFromLiveKit();
  showCallSummary();
});
```

| Field | Type |
|-------|------|
| `callId` | `string` |

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

## 📤 Client → Server Events

### call:accept

Accept an incoming call.

```javascript
socket.emit('call:accept', {
  callId: '507f1f77bcf86cd799439081'
});
```

| Field | Type | Required |
|-------|------|----------|
| `callId` | `string` | ✅ Yes |

**Response:**
- ✅ Success → `call:accepted` event
- ❌ Failure → `error` event

---

### call:reject

Reject an incoming call.

```javascript
socket.emit('call:reject', {
  callId: '507f1f77bcf86cd799439081'
});
```

| Field | Type | Required |
|-------|------|----------|
| `callId` | `string` | ✅ Yes |

> **Note:** User receives `call:rejected` event.

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

> **Note:** User receives `call:ended`. Call duration is calculated. Status returns to `ONLINE`.

---

## ⏱️ Rate Limits

| Action | Limit |
|--------|-------|
| `call:accept` | 20 per minute |
| `call:reject` | 20 per minute |
| `call:end` | 20 per minute |
| Connection | 10 per minute per IP |

---

## 🔌 Disconnect Handling

| Status | Action |
|--------|--------|
| `ONLINE` | Status → `OFFLINE`, users notified via `telecaller:presence-changed` |
| `RINGING` | Call → `MISSED`, user notified via `call:missed` |
| `ON_CALL` | Call → `COMPLETED`, user notified via `call:ended`, LiveKit room destroyed |
