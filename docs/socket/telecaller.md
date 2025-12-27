# 🔌 Telecaller Socket Events

Real-time socket events for telecaller namespace.

---

## 📡 Connection

### Namespace URL

```text
http://localhost:8000/telecaller
```

### Authentication

Send JWT token during connection:

```javascript
const socket = io('http://localhost:8000/telecaller', {
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
});
```

### Connection Requirements

| Requirement | Description |
| --- | --- |
| Token | Valid JWT token |
| Role | TELECALLER |
| Account Status | ACTIVE |
| Approval Status | APPROVED |

### Connection Errors

| Error | Description |
| --- | --- |
| Authentication token required | No token provided |
| Invalid or expired token | Token is invalid or expired |
| Access denied | User role is not TELECALLER |
| Account suspended. Please contact support. | Account is blocked |
| Account not approved. Please wait for admin approval. | Profile pending or rejected |
| Too many connection attempts. Please wait. | Rate limited |

## 📋 Events Overview

### Client → Server (Emit)

| Event | Description |
| --- | --- |
| call:accept | Accept an incoming call |
| call:reject | Reject an incoming call |
| call:end | End active call |

### Server → Client (Listen)

| Event | Description |
| --- | --- |
| call:incoming | New call request from user |
| call:accepted | Confirmation of call acceptance (contains LiveKit token) |
| call:missed | Call was not answered (30s timeout) |
| call:cancelled | User cancelled the call while ringing |
| call:ended | Call ended by user |
| error | General error |

## 📞 Call Flow Diagram

### Incoming Call Flow

```text
User                        Server                      Telecaller
  |                            |                            |
  |  call:initiate             |                            |
  |--------------------------->|                            |
  |                            |  call:incoming             |
  |                            |  {callId, callType, caller}|
  |                            |--------------------------->|
  |                            |                            |
  |                            |  (Telecaller UI Rings)     |
```

### Accept Call Flow

```text
User                        Server                      Telecaller
  |                            |                            |
  |                            |  call:accept               |
  |                            |  {callId}                  |
  |                            |<---------------------------|
  |  call:accepted             |                            |
  |  {callId, livekit}         |  call:accepted             |
  |<---------------------------|  {callId, callType,        |
  |                            |   caller, livekit}         |
  |                            |--------------------------->|
  |                            |                            |
  |        ⬇️ LiveKit Call Active ⬇️                         |
```

## 📥 Server → Client Events

### call:incoming

A user is calling you.

#### call:incoming Listen

```javascript
socket.on('call:incoming', (data) => {
  // Show incoming call screen
  showIncomingCall(data);
});
```

#### call:incoming Payload

| Field | Type | Description |
| --- | --- | --- |
| callId | string | Unique Call ID |
| callType | string | AUDIO or VIDEO |
| caller | object | User details |

#### call:incoming Caller Object

| Field | Type | Description |
| --- | --- | --- |
| _id | string | User ID |
| name | string | User Name |
| profile | string/null | Avatar identifier |

#### call:incoming Example

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

### call:accepted

Confirmation that the call was successfully accepted. Contains connection details for video/audio.

#### call:accepted Listen

```javascript
socket.on('call:accepted', (data) => {
  // Connect to LiveKit room
  connectToLiveKit(data.livekit);
});
```

#### call:accepted Payload

| Field | Type | Description |
| --- | --- | --- |
| callId | string | Call ID |
| callType | string | AUDIO or VIDEO |
| caller | object | User details |
| livekit | object | LiveKit connection credentials |

#### call:accepted LiveKit Object

| Field | Type | Description |
| --- | --- | --- |
| token | string | LiveKit access token |
| url | string | LiveKit server URL |
| roomName | string | Room name (same as callId) |

#### call:accepted Example

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

### call:missed

The call timed out (30 seconds) because you didn't answer.

#### call:missed Listen

```javascript
socket.on('call:missed', (data) => {
  // Hide incoming call screen
  // Show missed call notification
});
```

#### call:missed Payload

| Field | Type | Description |
| --- | --- | --- |
| callId | string | Call ID |

#### call:missed Example

```json
{
  "callId": "507f1f77bcf86cd799439081"
}
```

### call:cancelled

The user cancelled the call before you answered.

#### call:cancelled Listen

```javascript
socket.on('call:cancelled', (data) => {
  // Hide incoming call screen
});
```

#### call:cancelled Payload

| Field | Type | Description |
| --- | --- | --- |
| callId | string | Call ID |

#### call:cancelled Example

```json
{
  "callId": "507f1f77bcf86cd799439081"
}
```

### call:ended

The user hung up the active call.

#### call:ended Listen

```javascript
socket.on('call:ended', (data) => {
  // Disconnect LiveKit
  // Show call summary
});
```

#### call:ended Payload

| Field | Type | Description |
| --- | --- | --- |
| callId | string | Call ID |

#### call:ended Example

```json
{
  "callId": "507f1f77bcf86cd799439081"
}
```

### error

General socket or call logic error.

#### error Listen

```javascript
socket.on('error', (data) => {
  console.error(data.message);
});
```

#### error Payload

| Field | Type | Description |
| --- | --- | --- |
| message | string | Error message |

#### error Example

```json
{
  "message": "Call is no longer available."
}
```

## 📤 Client → Server Events

### call:accept

Accept an incoming call.

#### call:accept Emit

```javascript
socket.emit('call:accept', {
  callId: '507f1f77bcf86cd799439081'
});
```

#### call:accept Payload

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| callId | string | Yes | Call ID |

#### call:accept Response

- Success: Triggers `call:accepted` event
- Failure: Triggers `error` event

### call:reject

Reject an incoming call.

#### call:reject Emit

```javascript
socket.emit('call:reject', {
  callId: '507f1f77bcf86cd799439081'
});
```

#### call:reject Payload

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| callId | string | Yes | Call ID |

#### call:reject Notes

- Stops ringing on user side
- User receives `call:rejected` event

### call:end

End an active call.

#### call:end Emit

```javascript
socket.emit('call:end', {
  callId: '507f1f77bcf86cd799439081'
});
```

#### call:end Payload

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| callId | string | Yes | Call ID |

#### call:end Notes

- User receives `call:ended` event
- Call duration is calculated
- Telecaller status returns to ONLINE

## ⏱️ Rate Limiting

| Action | Limit |
| --- | --- |
| call:accept | 20 per minute |
| call:reject | 20 per minute |
| call:end | 20 per minute |
| Connection | 10 per minute per IP |

## 🔌 Disconnect Handling

When telecaller disconnects (closes app, internet loss):

### If ONLINE

- Status changes to OFFLINE immediately
- Users are notified via `telecaller:presence-changed`

### If RINGING (Incoming Call)

- Call marked as MISSED
- User notified via `call:missed`

### If ON_CALL (Active Call)

- Call marked as COMPLETED
- User notified via `call:ended`
- LiveKit room destroyed
