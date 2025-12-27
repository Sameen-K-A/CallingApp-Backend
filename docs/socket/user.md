# 🔌 User Socket Events

Real-time socket events for user namespace.

## 📡 Connection

### Namespace URL

```text
http://localhost:8000/user
```

### Authentication

Send JWT token during connection:

```javascript
const socket = io('http://localhost:8000/user', {
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
});
```

### Connection Requirements

| Requirement | Description |
| --- | --- |
| Token | Valid JWT token |
| Role | USER |
| Account Status | ACTIVE |

### Connection Errors

| Error | Description |
| --- | --- |
| Authentication token required | No token provided |
| Invalid or expired token | Token is invalid or expired |
| Access denied | User role is not USER |
| Account suspended. Please contact support. | Account is blocked |
| Too many connection attempts. Please wait. | Rate limited |

## 📋 Events Overview

### Client → Server (Emit)

| Event | Description |
| --- | --- |
| call:initiate | Start a call to telecaller |
| call:cancel | Cancel outgoing call (while ringing) |
| call:end | End active call |

### Server → Client (Listen)

| Event | Description |
| --- | --- |
| telecaller:presence-changed | Telecaller online status changed |
| call:ringing | Call is ringing on telecaller side |
| call:accepted | Telecaller accepted the call |
| call:rejected | Telecaller rejected the call |
| call:missed | Call was not answered (30s timeout) |
| call:ended | Call ended by telecaller |
| call:error | Call-related error |
| error | General error |

## 📞 Call Flow Diagram

### Successful Call Flow

```text
User                        Server                      Telecaller
  |                            |                            |
  |  call:initiate             |                            |
  |  {telecallerId, callType}  |                            |
  |--------------------------->|                            |
  |                            |  call:incoming             |
  |                            |  {callId, callType, caller}|
  |                            |--------------------------->|
  |  call:ringing              |                            |
  |  {callId, telecaller}      |                            |
  |<---------------------------|                            |
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
  |                            |                            |
  |  call:end                  |                            |
  |  {callId}                  |                            |
  |--------------------------->|                            |
  |                            |  call:ended                |
  |                            |  {callId}                  |
  |                            |--------------------------->|
```

### Rejected Call Flow

```text
User                        Server                      Telecaller
  |                            |                            |
  |  call:initiate             |                            |
  |--------------------------->|                            |
  |                            |  call:incoming             |
  |                            |--------------------------->|
  |  call:ringing              |                            |
  |<---------------------------|                            |
  |                            |  call:reject               |
  |                            |  {callId}                  |
  |                            |<---------------------------|
  |  call:rejected             |                            |
  |  {callId}                  |                            |
  |<---------------------------|                            |
```

### Cancelled Call Flow

```text
User                        Server                      Telecaller
  |                            |                            |
  |  call:initiate             |                            |
  |--------------------------->|                            |
  |                            |  call:incoming             |
  |                            |--------------------------->|
  |  call:ringing              |                            |
  |<---------------------------|                            |
  |                            |                            |
  |  call:cancel               |                            |
  |  {callId}                  |                            |
  |--------------------------->|                            |
  |                            |  call:cancelled            |
  |                            |  {callId}                  |
  |                            |--------------------------->|
```

### Missed Call Flow (30s Timeout)

```text
User                        Server                      Telecaller
  |                            |                            |
  |  call:initiate             |                            |
  |--------------------------->|                            |
  |                            |  call:incoming             |
  |                            |--------------------------->|
  |  call:ringing              |                            |
  |<---------------------------|                            |
  |                            |                            |
  |        ⏰ 30 seconds pass - No response ⏰               |
  |                            |                            |
  |  call:missed               |  call:missed               |
  |  {callId}                  |  {callId}                  |
  |<---------------------------|--------------------------->|
```

## 📤 Client → Server Events

### call:initiate

Start a call to a telecaller.

#### call:initiate Emit

```javascript
socket.emit('call:initiate', {
  telecallerId: '507f1f77bcf86cd799439031',
  callType: 'AUDIO'
});
```

#### call:initiate Payload

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| telecallerId | string | Yes | Telecaller's user ID |
| callType | string | Yes | AUDIO or VIDEO |

#### call:initiate Possible Responses

| Event | Condition |
| --- | --- |
| call:ringing | Call initiated successfully |
| call:error | Failed to initiate call |

#### call:initiate Error Messages

| Message | Cause |
| --- | --- |
| Invalid call request | Missing telecallerId or callType |
| Invalid call type | callType is not AUDIO or VIDEO |
| Too many call attempts. Please wait a moment. | Rate limited |
| Your account is not available. Please contact support. | User account issue |
| This person is no longer available for calls. | Telecaller not found or not approved |
| {name} is currently offline. Please try again later. | Telecaller is offline |
| {name} is busy on another call. Please try again later. | Telecaller is on another call |
| {name} is currently unavailable. Please try again later. | Telecaller not connected to socket |
| You already have an active call. | User has existing active call |

### call:cancel

Cancel an outgoing call while it's ringing.

#### call:cancel Emit

```javascript
socket.emit('call:cancel', {
  callId: '507f1f77bcf86cd799439081'
});
```

#### call:cancel Payload

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| callId | string | Yes | Call ID |

#### call:cancel Notes

- Can only cancel calls in RINGING status
- Telecaller receives call:cancelled event

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

- Can only end calls in ACCEPTED status
- Telecaller receives call:ended event
- Call duration and coins are calculated

## 📥 Server → Client Events

### telecaller:presence-changed

Telecaller's online status changed.

#### telecaller:presence-changed Listen

```javascript
socket.on('telecaller:presence-changed', (data) => {
  console.log(`Telecaller ${data.telecallerId} is now ${data.presence}`);
});
```

#### telecaller:presence-changed Payload

| Field | Type | Description |
| --- | --- | --- |
| telecallerId | string | Telecaller's user ID |
| presence | string | ONLINE, OFFLINE, or ON_CALL |
| telecaller | object/null | Telecaller details (on ONLINE) |

#### telecaller:presence-changed Telecaller Object (when presence is ONLINE)

| Field | Type | Description |
| --- | --- | --- |
| _id | string | Telecaller's user ID |
| name | string | Telecaller's name |
| profile | string/null | Avatar identifier |
| language | string | Preferred language |
| about | string | Telecaller's bio |

#### telecaller:presence-changed Example - ONLINE

```json
{
  "telecallerId": "507f1f77bcf86cd799439031",
  "presence": "ONLINE",
  "telecaller": {
    "_id": "507f1f77bcf86cd799439031",
    "name": "Jane Smith",
    "profile": "avatar-3",
    "language": "hindi",
    "about": "Experienced telecaller with 5 years of experience."
  }
}
```

#### telecaller:presence-changed Example - OFFLINE

```json
{
  "telecallerId": "507f1f77bcf86cd799439031",
  "presence": "OFFLINE",
  "telecaller": null
}
```

#### telecaller:presence-changed Example - ON_CALL

```json
{
  "telecallerId": "507f1f77bcf86cd799439031",
  "presence": "ON_CALL",
  "telecaller": null
}
```

### call:ringing

Call is ringing on telecaller's device.

#### call:ringing Listen

```javascript
socket.on('call:ringing', (data) => {
  console.log(`Call ${data.callId} is ringing`);
});
```

#### call:ringing Payload

| Field | Type | Description |
| --- | --- | --- |
| callId | string | Call ID |
| telecaller | object | Telecaller info |

#### call:ringing Telecaller Object

| Field | Type | Description |
| --- | --- | --- |
| _id | string | Telecaller's user ID |
| name | string | Telecaller's name |
| profile | string/null | Avatar identifier |

#### call:ringing Example

```json
{
  "callId": "507f1f77bcf86cd799439081",
  "telecaller": {
    "_id": "507f1f77bcf86cd799439031",
    "name": "Jane Smith",
    "profile": "avatar-3"
  }
}
```

### call:accepted

Telecaller accepted the call.

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
  "livekit": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "url": "wss://your-livekit-server.com",
    "roomName": "507f1f77bcf86cd799439081"
  }
}
```

### call:rejected

Telecaller rejected the call.

#### call:rejected Listen

```javascript
socket.on('call:rejected', (data) => {
  console.log(`Call ${data.callId} was rejected`);
});
```

#### call:rejected Payload

| Field | Type | Description |
| --- | --- | --- |
| callId | string | Call ID |

#### call:rejected Example

```json
{
  "callId": "507f1f77bcf86cd799439081"
}
```

### call:missed

Call was not answered within 30 seconds.

#### call:missed Listen

```javascript
socket.on('call:missed', (data) => {
  console.log(`Call ${data.callId} was missed`);
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

### call:ended

Call was ended by telecaller.

#### call:ended Listen

```javascript
socket.on('call:ended', (data) => {
  // Disconnect from LiveKit
  disconnectFromLiveKit();
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

### call:error

Call-related error occurred.

#### call:error Listen

```javascript
socket.on('call:error', (data) => {
  console.error(`Call error: ${data.message}`);
});
```

#### call:error Payload

| Field | Type | Description |
| --- | --- | --- |
| message | string | Error message |

#### call:error Example

```json
{
  "message": "This person is currently offline. Please try again later."
}
```

### error

General socket error.

#### error Listen

```javascript
socket.on('error', (data) => {
  console.error(`Socket error: ${data.message}`);
});
```

#### error Payload

| Field | Type | Description |
| --- | --- | --- |
| message | string | Error message |

#### error Example

```json
{
  "message": "An error occurred"
}
```

## ⏱️ Rate Limiting

| Action | Limit |
| --- | --- |
| call:initiate | 5 per minute |
| call:cancel | 20 per minute |
| call:end | 20 per minute |
| Connection | 10 per minute per IP |

## 🔌 Disconnect Handling

When user disconnects unexpectedly:

| Call Status | Action |
| --- | --- |
| RINGING | Call marked as MISSED, telecaller notified |
| ACCEPTED | Call marked as COMPLETED, telecaller notified, LiveKit room destroyed |
