# 📞 Call Workflow

## 🔁 High-Level Call Flow

### 1. User Initiates Call

1. User connects to `/user` namespace with JWT.
2. User emits `call:initiate` with:
   - `telecallerId`
   - `callType` (`AUDIO` or `VIDEO`)
3. Server:
   - Validates user (role=USER, status=ACTIVE)
   - Validates telecaller (role=TELECALLER, status=ACTIVE, `APPROVED`)
   - Checks telecaller presence: not `OFFLINE` or `ON_CALL`
   - Ensures no active call for this user/telecaller (MongoDB unique index)
   - Creates `Call` document in DB with status `RINGING`
   - Starts a **30-second timer** in memory
   - Sends:
     - `call:incoming` to telecaller
     - `call:ringing` to user

### 2. Telecaller Decides

Telecaller has 3 options during `RINGING`:

1. **Accept**:
   - Emits `call:accept`
   - Server:
     - Changes call to `ACCEPTED`
     - Clears 30s timer
     - Generates LiveKit tokens for both
     - Updates telecaller presence to `ON_CALL`
     - Sends `call:accepted` to:
       - User (with `livekit` token)
       - Telecaller (with `livekit` + caller info)

2. **Reject**:
   - Emits `call:reject`
   - Server:
     - Changes call to `REJECTED`
     - Clears 30s timer
     - Sends `call:rejected` to user

3. **Do Nothing**:
   - After 30s timer:
     - Server checks call is still `RINGING`
     - Changes call to `MISSED`
     - Sends `call:missed` to user & telecaller

### 3. Call in Progress (ACCEPTED)

Once accepted and LiveKit connected:

- User and telecaller are in a LiveKit room (1:1)
- Telecaller presence is set to `ON_CALL`
- Both can hang up using `call:end`

### 4. Call Ended

When either side ends the call:

- Endpoint used:
  - User: `call:end` from `/user` namespace
  - Telecaller: `call:end` from `/telecaller` namespace
- Server:
  - Validates call is `ACCEPTED`
  - Calculates duration (from `acceptedAt`)
  - Updates call:
    - status: `COMPLETED`
    - `endedAt`, `durationInSeconds`
  - Sets telecaller presence back to `ONLINE`
  - Destroys LiveKit room
  - Notifies the other party via `call:ended`

---

## 📜 Detailed Sequence Diagrams

### ✅ Successful Call (User → Telecaller)

```text
User                           Server                           Telecaller
│                                │                                  │
│  connect /user (JWT)           │                                  │
│───────────────────────────────>│                                  │
│                                │                                  │
│  call:initiate                 │                                  │
│  {telecallerId, callType}      │                                  │
│───────────────────────────────>│                                  │
│                                │ Validate user & telecaller       │
│                                │ Create Call: status=RINGING      │
│                                │ Start 30s timer                  │
│                                │                                  │
│  call:ringing                  │                                  │
│  {callId, telecaller}          │                                  │
│<───────────────────────────────│                                  │
│                                │  call:incoming                   │
│                                │  {callId, callType, caller}      │
│                                │─────────────────────────────────>│
│                                │                                  │
│                                │                                  │  UI shows incoming call
│                                │                                  │
│                                │  call:accept                     │
│                                │  {callId}                        │
│                                │<─────────────────────────────────│
│                                │                                  │
│                                │ Clear 30s timer                  │
│                                │ Update status=ACCEPTED           │
│                                │ Generate LiveKit tokens          │
│                                │                                  │
│  call:accepted                 │                                  │
│  {callId, livekit}             │                                  │
│<───────────────────────────────│                                  │
│                                │  call:accepted                   │
│                                │  {callId, callType,              │
│                                │   caller, livekit}               │
│                                │─────────────────────────────────>│
│                                │                                  │
│   🔊 LiveKit call in progress 🔊                                  │
│                                │                                  │
│  call:end                      │                                  │
│  {callId}                      │                                  │
│───────────────────────────────>│                                  │
│                                │ Update status=COMPLETED          │
│                                │ Set presence=ONLINE              │
│                                │ Destroy LiveKit room             │
│                                │                                  │
│                                │  call:ended                      │
│                                │  {callId}                        │
│                                │─────────────────────────────────>│
│                                │                                  │
```

### ❌ Telecaller Rejects

```text
User                           Server                           Telecaller
│                                │                                  │
│  call:initiate                 │                                  │
│───────────────────────────────>│                                  │
│  call:ringing                  │                                  │
│<───────────────────────────────│                                  │
│                                │  call:incoming                   │
│                                │─────────────────────────────────>│
│                                │                                  │
│                                │                                  │  User sees incoming call UI
│                                │                                  │
│                                │  call:reject                     │
│                                │  {callId}                        │
│                                │<─────────────────────────────────│
│                                │                                  │
│                                │ Update status=REJECTED           │
│                                │ Clear 30s timer                  │
│                                │                                  │
│  call:rejected                 │                                  │
│  {callId}                      │                                  │
│<───────────────────────────────│                                  │
│                                │                                  │
```

### ❌ User Cancels Before Answer

```text
User                           Server                           Telecaller
│                                │                                  │
│  call:initiate                 │                                  │
│───────────────────────────────>│                                  │
│  call:ringing                  │                                  │
│<───────────────────────────────│                                  │
│                                │  call:incoming                   │
│                                │─────────────────────────────────>│
│                                │                                  │
│  call:cancel                   │                                  │
│  {callId}                      │                                  │
│───────────────────────────────>│                                  │
│                                │ Update status=MISSED             │
│                                │ Clear 30s timer                  │
│                                │                                  │
│                                │  call:cancelled                  │
│                                │  {callId}                        │
│                                │─────────────────────────────────>│
│                                │                                  │
```

### ⏰ Call Missed (No Answer in 30s)

```text
User                           Server                           Telecaller
│                                │                                  │
│  call:initiate                 │                                  │
│───────────────────────────────>│                                  │
│  call:ringing                  │                                  │
│<───────────────────────────────│                                  │
│                                │  call:incoming                   │
│                                │─────────────────────────────────>│
│                                │                                  │
│              (No action for 30s from telecaller)                  │
│                                │                                  │
│           ⏰ Timer fires after 30s (still RINGING)                │
│                                │                                  │
│                                │ Update status=MISSED             │
│                                │                                  │
│  call:missed                   │  call:missed                     │
│  {callId}                      │  {callId}                        │
│<───────────────────────────────│─────────────────────────────────>│
│                                │                                  │
```

## 🧨 Disconnect Scenarios

### User Disconnects

#### During ACCEPTED (Active Call)

- Mark call as COMPLETED
- Telecaller receives `call:ended`
- Telecaller presence set to ONLINE
- LiveKit room destroyed

#### During RINGING (User Disconnect)

- Mark call as MISSED
- Telecaller receives `call:cancelled`

### Telecaller Disconnects

#### During ACCEPTED (Telecaller Disconnect)

- Mark call as COMPLETED
- User receives `call:ended`
- LiveKit room destroyed

#### During RINGING (Telecaller Disconnect)

- Mark call as MISSED
- User receives `call:missed`
