# 📞 Call Workflow

> Complete documentation of the call flow between users and telecallers.

---

## 📋 Quick Reference

### Call States

| Status | Description |
|--------|-------------|
| `RINGING` | Call initiated, waiting for telecaller response |
| `ACCEPTED` | Call accepted, LiveKit active |
| `COMPLETED` | Call ended normally |
| `REJECTED` | Telecaller declined the call |
| `MISSED` | No answer within 30 seconds |
| `CANCELLED` | User cancelled before answer |

### Timeout

| Timer | Duration | Action |
|-------|----------|--------|
| Ring timeout | 30 seconds | Call marked as `MISSED` |

---

## 🔁 High-Level Flow

### 1️⃣ User Initiates Call

```
User                                    Server
  │                                        │
  │  call:initiate                         │
  │  { telecallerId, callType }            │
  │───────────────────────────────────────>│
  │                                        │
  │                                        │ ✓ Validate user (USER, ACTIVE)
  │                                        │ ✓ Validate telecaller (APPROVED)
  │                                        │ ✓ Check presence (not OFFLINE/ON_CALL)
  │                                        │ ✓ Create Call (status: RINGING)
  │                                        │ ✓ Start 30s timer
  │                                        │
  │  call:ringing                          │──> call:incoming to Telecaller
  │<───────────────────────────────────────│
```

### 2️⃣ Telecaller Decides

| Action | Telecaller Emits | Result |
|--------|------------------|--------|
| **Accept** | `call:accept` | Status → `ACCEPTED`, LiveKit tokens generated |
| **Reject** | `call:reject` | Status → `REJECTED`, user notified |
| **No action** | - | After 30s → Status → `MISSED` |

### 3️⃣ Call in Progress

- User and telecaller connected via **LiveKit** (1:1 room)
- Telecaller presence: `ON_CALL`
- Either party can end call using `call:end`

### 4️⃣ Call Ended

| Step | Action |
|------|--------|
| 1 | Validate call is `ACCEPTED` |
| 2 | Calculate duration from `acceptedAt` |
| 3 | Update: status → `COMPLETED`, `endedAt`, `durationInSeconds` |
| 4 | Telecaller presence → `ONLINE` |
| 5 | Destroy LiveKit room |
| 6 | Notify other party via `call:ended` |

---

## 📜 Sequence Diagrams

### ✅ Successful Call

```
User                        Server                       Telecaller
  │                            │                              │
  │  connect /user (JWT)       │                              │
  │───────────────────────────>│                              │
  │                            │                              │
  │  call:initiate             │                              │
  │  {telecallerId, callType}  │                              │
  │───────────────────────────>│                              │
  │                            │  Validate & create call      │
  │                            │  Start 30s timer             │
  │  call:ringing              │                              │
  │<───────────────────────────│                              │
  │                            │  call:incoming               │
  │                            │  {callId, callType, caller}  │
  │                            │─────────────────────────────>│
  │                            │                              │
  │                            │                    📱 Rings │
  │                            │                              │
  │                            │  call:accept                 │
  │                            │  {callId}                    │
  │                            │<─────────────────────────────│
  │                            │                              │
  │                            │  Clear timer                 │
  │                            │  Status → ACCEPTED           │
  │                            │  Generate LiveKit tokens     │
  │                            │                              │
  │  call:accepted             │  call:accepted               │
  │  {callId, livekit}         │  {callId, livekit, caller}   │
  │<───────────────────────────│─────────────────────────────>│
  │                            │                              │
  │           🔊 LiveKit Call Active 🔊                      │
  │                            │                              │
  │  call:end                  │                              │
  │  {callId}                  │                              │
  │───────────────────────────>│                              │
  │                            │  Status → COMPLETED          │
  │                            │  Presence → ONLINE           │
  │                            │  Destroy LiveKit room        │
  │                            │                              │
  │                            │  call:ended                  │
  │                            │  {callId}                    │
  │                            │─────────────────────────────>│
```

---

### ❌ Telecaller Rejects

```
User                        Server                       Telecaller
  │                            │                              │
  │  call:initiate             │                              │
  │───────────────────────────>│                              │
  │  call:ringing              │  call:incoming               │
  │<───────────────────────────│─────────────────────────────>│
  │                            │                              │
  │                            │  call:reject                 │
  │                            │  {callId}                    │
  │                            │<─────────────────────────────│
  │                            │                              │
  │                            │  Status → REJECTED           │
  │                            │  Clear timer                 │
  │                            │                              │
  │  call:rejected             │                              │
  │  {callId}                  │                              │
  │<───────────────────────────│                              │
```

---

### ❌ User Cancels

```
User                        Server                       Telecaller
  │                            │                              │
  │  call:initiate             │                              │
  │───────────────────────────>│                              │
  │  call:ringing              │  call:incoming               │
  │<───────────────────────────│─────────────────────────────>│
  │                            │                              │
  │  call:cancel               │                              │
  │  {callId}                  │                              │
  │───────────────────────────>│                              │
  │                            │  Status → MISSED             │
  │                            │  Clear timer                 │
  │                            │                              │
  │                            │  call:cancelled              │
  │                            │  {callId}                    │
  │                            │─────────────────────────────>│
```

---

### ⏰ Missed Call (30s Timeout)

```
User                        Server                       Telecaller
  │                            │                              │
  │  call:initiate             │                              │
  │───────────────────────────>│                              │
  │  call:ringing              │  call:incoming               │
  │<───────────────────────────│─────────────────────────────>│
  │                            │                              │
  │                            │                              │
  │        ⏰ 30 seconds pass - No response ⏰                 │
  │                            │                              │
  │                            │  Status → MISSED             │
  │                            │                              │
  │  call:missed               │  call:missed                 │
  │  {callId}                  │  {callId}                    │
  │<───────────────────────────│─────────────────────────────>│
```

---

## 🧨 Disconnect Scenarios

### User Disconnects

| During | Action | Telecaller Receives |
|--------|--------|---------------------|
| `RINGING` | Status → `MISSED` | `call:cancelled` |
| `ACCEPTED` | Status → `COMPLETED`, LiveKit destroyed | `call:ended` |

### Telecaller Disconnects

| During | Action | User Receives |
|--------|--------|---------------|
| `RINGING` | Status → `MISSED` | `call:missed` |
| `ACCEPTED` | Status → `COMPLETED`, LiveKit destroyed | `call:ended` |

---

## 📊 Call Status Transitions

```
                    ┌──────────────┐
                    │   RINGING    │
                    └──────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │   ACCEPTED   │ │   REJECTED   │ │    MISSED    │
   └──────────────┘ └──────────────┘ └──────────────┘
          │
          ▼
   ┌──────────────┐
   │  COMPLETED   │
   └──────────────┘
```

| Transition | Trigger |
|------------|---------|
| RINGING → ACCEPTED | Telecaller accepts |
| RINGING → REJECTED | Telecaller rejects |
| RINGING → MISSED | 30s timeout, user cancel, or disconnect |
| ACCEPTED → COMPLETED | Either party ends call or disconnects |
