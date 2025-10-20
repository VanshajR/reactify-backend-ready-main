# WebRTC Flow Complete Audit - January 20, 2025

## Current Issue
Users cannot see each other's video/audio feeds despite WebRTC signaling completing successfully.

## Flow Analysis

### Step 1: Initial Page Load
**File: src/pages/VideoCall.tsx**
- Line 66: `useWebRTC(socket, localStream, meetingId)` is called
- At this point: `socket` = connected, `localStream` = NULL, `meetingId` = available
- **Problem Identified**: Hook is initialized BEFORE media is obtained

### Step 2: Media Initialization
**File: src/pages/VideoCall.tsx, Lines 210-308**
```
useEffect(() => {
  if (!meetingValid) return;
  
  // Lines 215-219: FIRST emits join-room
  socket.emit('join-room', { roomId, userName, userIdentifier });
  
  // Lines 222-265: THEN initializes media
  const initMedia = async () => {
    const stream = await getUserMedia(...);
    setLocalStream(stream); // ← localStream becomes available HERE
  };
  
  initMedia();
}, [meetingValid, socket, meetingId, userName, isAdmin, toast, navigate]);
```

**Timeline:**
1. join-room emitted
2. Media initialization starts (async)
3. Backend processes join-room IMMEDIATELY
4. Backend sends user-joined/existing-participants IMMEDIATELY
5. Frontend WebRTC hook receives events BEFORE localStream is set
6. Peer connections created WITHOUT tracks

### Step 3: Backend Admission Flow
**File: backend/server.js, Lines 243-344**

When admin admits user:
```javascript
// Line 287: User joins Socket.IO room
userSocket.join(roomId);

// Line 294: Gets existing participants list
const participants = Array.from(room.values()).filter(p => p.id !== socketId);

// Line 299: Sends to admitted user
userSocket.emit('admitted', { roomId });
userSocket.emit('existing-participants', participants);

// Line 310: Broadcasts to others
io.to(roomId).except(socketId).emit('user-joined', {
  id: socketId,
  name: user.name
});
```

### Step 4: WebRTC Hook Event Handling
**File: src/hooks/useWebRTC.ts, Lines 247-309**

Socket listeners are registered:
```typescript
useEffect(() => {
  if (!socket || !roomId) return;
  
  socket.on('user-joined', ({ id }) => {
    createOffer(id); // ← Called IMMEDIATELY
  });
  
  socket.on('existing-participants', (participants) => {
    participants.forEach((participant) => {
      createOffer(participant.id); // ← Called IMMEDIATELY
    });
  });
}, [socket, roomId]); // ← NO localStream dependency
```

**Issue**: `createOffer()` is called but `localStream` might still be NULL at this point.

### Step 5: Create Offer Function
**File: src/hooks/useWebRTC.ts, Lines 149-177**

```typescript
const createOffer = async (userId: string) => {
  console.log(`📞 Attempting to create offer for user ${userId}`);
  console.log(`   Local stream available: ${!!localStream}`);
  
  if (!localStream) {
    console.warn('⚠️ No local stream yet');
    // ← Still creates peer connection even without stream!
  }
  
  const pc = createPeerConnection(userId); // ← Creates peer WITHOUT tracks
  peersRef.current.set(userId, { connection: pc });
  
  const offer = await pc.createOffer(...);
  await pc.setLocalDescription(offer);
  
  socket.emit('offer', { to: userId, offer, roomId });
}
```

### Step 6: Create Peer Connection
**File: src/hooks/useWebRTC.ts, Lines 30-44**

```typescript
const createPeerConnection = (userId: string): RTCPeerConnection => {
  const pc = new RTCPeerConnection(ICE_SERVERS);
  
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream); // ← Only adds if localStream exists
    });
  } else {
    console.warn(`⚠️ No local stream available`);
    // ← Peer connection has NO TRACKS!
  }
  
  pc.ontrack = (event) => {
    // This will receive remote tracks
  };
  
  return pc;
}
```

**CRITICAL ISSUE**: Peer connection is created and offer is sent WITHOUT any tracks!

### Step 7: Later - LocalStream Becomes Available
**File: src/hooks/useWebRTC.ts, Lines 320-326**

```typescript
useEffect(() => {
  if (localStream && peersRef.current.size > 0) {
    console.log(`🎬 Local stream NOW available! Adding tracks to ${peersRef.current.size} existing peer(s)`);
    addLocalTracksToPeers(localStream);
  }
}, [localStream]);
```

This tries to add tracks AFTER peer connections already exist.

### Step 8: Add Local Tracks to Peers (JUST FIXED)
**File: src/hooks/useWebRTC.ts, Lines 120-146**

The function NOW includes renegotiation, but there's still a race condition issue.

---

## ROOT CAUSE IDENTIFIED

**The Problem:**
1. `join-room` is emitted BEFORE media is obtained
2. Backend immediately sends `user-joined`/`existing-participants` 
3. WebRTC hook receives events and creates peer connections WITHOUT tracks
4. Offers are sent without any media tracks
5. When localStream becomes available later, tracks are added but may not trigger properly

**The Solution:**
We need to DELAY the `join-room` emit until AFTER localStream is available, OR we need to NOT create offers until localStream is available.

---

## Proposed Fix

### Option 1: Delay join-room until media is ready
Move the join-room emit to AFTER media initialization completes.

### Option 2: Queue offer creation
Store userIds that need offers, wait for localStream, then create all offers.

### Option 3: Always renegotiate when localStream becomes available
Ensure renegotiation ALWAYS happens and works correctly.

---

## Testing Checklist

After fix:
- [ ] Admin creates meeting - sees own video immediately
- [ ] Guest joins - goes to waiting room
- [ ] Admin admits guest
- [ ] Both users see TWO video feeds (self + remote)
- [ ] Console shows: `📡 Received video track from [userId]`
- [ ] Console shows: `✅ Remote stream received from [userId]`
- [ ] Chat works bidirectionally
- [ ] User leaving updates on other side
- [ ] Screen share visible to both users

