# 🛡️ Admin Socket Events

Real-time socket events for admin namespace.

---

## 📡 Connection

### Namespace URL

```text
http://localhost:8000/admin
```

### Authentication

Token is automatically read from authenticationToken cookie.

```javascript
const socket = io('http://localhost:8000/admin', {
  withCredentials: true // Important for cookies
});
```

### Connection Requirements

| Requirement | Description |
| --- | --- |
| Cookie | Valid authenticationToken cookie |
| Role | ADMIN |

### Connection Errors

| Error | Description |
| --- | --- |
| Authentication token required | No cookie found |
| Invalid or expired token | Token expired |
| Access denied | Role is not ADMIN |

## 📋 Events Overview

### Client → Server (Emit)

| Event | Description |
| --- | --- |
| presence:request-counts | Request current online user/telecaller counts |

### Server → Client (Listen)

| Event | Description |
| --- | --- |
| presence:counts | Response with online counts |
| error | General error |

## 📤 Client → Server Events

### presence:request-counts

Request the current number of online users and telecallers.

#### presence:request-counts Emit

```javascript
socket.emit('presence:request-counts');
```

#### presence:request-counts Response

- Success: Triggers `presence:counts` event
- Failure: Triggers `error` event

## 📥 Server → Client Events

### presence:counts

Contains current online statistics.

#### presence:counts Listen

```javascript
socket.on('presence:counts', (data) => {
  console.log(`Users: ${data.onlineUsers}, Telecallers: ${data.onlineTelecallers}`);
});
```

#### presence:counts Payload

| Field | Type | Description |
| --- | --- | --- |
| onlineUsers | number | Count of active user sockets |
| onlineTelecallers | number | Count of active telecaller sockets |
| timestamp | string | ISO timestamp of the snapshot |

#### presence:counts Example

```json
{
  "onlineUsers": 142,
  "onlineTelecallers": 28,
  "timestamp": "2024-01-19T10:30:00.000Z"
}
```

### error

General socket error.

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
  "message": "Failed to fetch presence counts"
}
```
