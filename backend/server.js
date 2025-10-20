const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:8080',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());


mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/videocall', {
 useNewUrlParser: true,
 useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));


const meetingRoutes = require('./routes/meetings');
app.use('/api/meetings', meetingRoutes);

// Import Meeting model for auto-delete
const Meeting = require('./models/Meeting');

// Auto-delete meetings with no participants after 5 minutes
const AUTO_DELETE_DELAY = 5 * 60 * 1000; // 5 minutes in milliseconds
const meetingTimers = new Map(); // Store timers for each meeting

const scheduleAutoDelete = async (roomId) => {
  // Clear any existing timer for this meeting
  if (meetingTimers.has(roomId)) {
    clearTimeout(meetingTimers.get(roomId));
  }

  // Set new timer
  const timer = setTimeout(async () => {
    try {
      const meeting = await Meeting.findOne({ meetingId: roomId });
      if (meeting) {
        await Meeting.findOneAndDelete({ meetingId: roomId });
        console.log(`Auto-deleted meeting ${roomId} after 5 minutes of inactivity`);
        meetingTimers.delete(roomId);
      }
    } catch (error) {
      console.error(`Error auto-deleting meeting ${roomId}:`, error);
    }
  }, AUTO_DELETE_DELAY);

  meetingTimers.set(roomId, timer);
  
  // Update database to track when last participant left
  try {
    await Meeting.findOneAndUpdate(
      { meetingId: roomId },
      { lastParticipantLeftAt: new Date() }
    );
  } catch (error) {
    console.error(`Error updating lastParticipantLeftAt for ${roomId}:`, error);
  }
};

const cancelAutoDelete = async (roomId) => {
  // Cancel scheduled deletion when someone joins
  if (meetingTimers.has(roomId)) {
    clearTimeout(meetingTimers.get(roomId));
    meetingTimers.delete(roomId);
    console.log(`Cancelled auto-delete for meeting ${roomId}`);
  }

  // Clear the lastParticipantLeftAt timestamp
  try {
    await Meeting.findOneAndUpdate(
      { meetingId: roomId },
      { lastParticipantLeftAt: null }
    );
  } catch (error) {
    console.error(`Error clearing lastParticipantLeftAt for ${roomId}:`, error);
  }
};


const rooms = new Map(); // roomId -> Map of participants
const waitingRoom = new Map(); // roomId -> Array of waiting participants
const permissions = new Map(); // socketId -> { allowAudio, allowVideo, allowScreenShare }

io.on('connection', (socket) => {
 console.log('New client connected:', socket.id);

 socket.on('create-room', async ({ roomId, userName, userIdentifier }) => {
 socket.join(roomId);
 
 if (!rooms.has(roomId)) {
 rooms.set(roomId, new Map());
 }
 if (!waitingRoom.has(roomId)) {
 waitingRoom.set(roomId, []);
 }

 // Verify admin status from database
 let isActualAdmin = false;
 try {
 const meeting = await Meeting.findOne({ meetingId: roomId });
 if (meeting && meeting.createdBy === userIdentifier) {
 isActualAdmin = true;
 }
 } catch (error) {
 console.error('Error verifying admin:', error);
 }
 
 const room = rooms.get(roomId);
 room.set(socket.id, {
 id: socket.id,
 name: userName,
 userIdentifier,
 isAdmin: isActualAdmin,
 isMuted: false,
 isVideoOff: false,
 isScreenSharing: false,
 });

 // Admin gets all permissions by default
 if (isActualAdmin) {
 permissions.set(socket.id, {
 allowAudio: true,
 allowVideo: true,
 allowScreenShare: true,
 });
 }

 // Cancel auto-delete since someone joined
 cancelAutoDelete(roomId);

 socket.emit('room-created', { roomId, isAdmin: isActualAdmin });
 socket.emit('admin-status', { isAdmin: isActualAdmin });
 console.log(`Room ${roomId} created by admin ${userName}`);
 });

 socket.on('join-room', async ({ roomId, userName, userIdentifier }) => {
 console.log(`🔑 Join request: ${userName} (${socket.id}) trying to join ${roomId}`);
 console.log(`   User Identifier: ${userIdentifier}`);
 
 if (!rooms.has(roomId)) {
 rooms.set(roomId, new Map());
 }
 if (!waitingRoom.has(roomId)) {
 waitingRoom.set(roomId, []);
 }

 // Verify admin status from database
 let isActualAdmin = false;
 try {
 const meeting = await Meeting.findOne({ meetingId: roomId });
 console.log(`   Meeting found: ${!!meeting}, createdBy: ${meeting?.createdBy}`);
 if (meeting && meeting.createdBy === userIdentifier) {
 isActualAdmin = true;
 }
 } catch (error) {
 console.error('❌ Error verifying admin:', error);
 }

 console.log(`   Is Admin: ${isActualAdmin}`);

 // If admin, join directly
 if (isActualAdmin) {
 socket.join(roomId);
 const room = rooms.get(roomId);
 room.set(socket.id, {
 id: socket.id,
 name: userName,
 userIdentifier,
 isAdmin: true,
 isMuted: false,
 isVideoOff: false,
 isScreenSharing: false,
 });

 permissions.set(socket.id, {
 allowAudio: true,
 allowVideo: true,
 allowScreenShare: true,
 });

 cancelAutoDelete(roomId);
 
 // Get current participants before emitting
 const existingParticipants = Array.from(room.values()).filter(p => p.id !== socket.id);
 
 // Send existing participants to the newly joined admin
 socket.emit('existing-participants', existingParticipants);
 socket.emit('admin-status', { isAdmin: true });
 
 // Notify others that admin joined
 socket.to(roomId).emit('user-joined', { 
 id: socket.id,
 name: userName,
 isAdmin: true,
 isMuted: false,
 isVideoOff: false,
 isScreenSharing: false,
 });
 console.log(`Admin ${userName} joined room ${roomId}`);
 return;
 }

 // Non-admin goes to waiting room
 const waiting = waitingRoom.get(roomId);
 waiting.push({
 socketId: socket.id,
 name: userName,
 userIdentifier,
 joinedAt: new Date(),
 });

 socket.emit('waiting-room', { message: 'Waiting for admin to admit you' });
 socket.emit('admin-status', { isAdmin: false });
 
 // Notify all admins in the room
 const room = rooms.get(roomId);
 console.log(`🚪 ${userName} in waiting room. Notifying admins...`);
 console.log(`   Room has ${room.size} participants`);
 
 let adminCount = 0;
 room.forEach((participant, participantSocketId) => {
 console.log(`   Participant ${participant.name} (${participantSocketId}): isAdmin=${participant.isAdmin}`);
 if (participant.isAdmin) {
 adminCount++;
 console.log(`   ✉️ Sending join-request to admin ${participant.name}`);
 io.to(participantSocketId).emit('join-request', {
 socketId: socket.id,
 name: userName,
 userIdentifier,
 });
 }
 });

 console.log(`${userName} is in waiting room for ${roomId}. Notified ${adminCount} admin(s).`);
 });

 // Admin admit user
 socket.on('admit-user', ({ roomId, socketId }) => {
 console.log(`🔓 Admin attempting to admit user ${socketId} to room ${roomId}`);
 
 const room = rooms.get(roomId);
 const participant = room.get(socket.id);
 
 // Verify requester is admin
 if (!participant || !participant.isAdmin) {
 console.log(`❌ Admit denied - requester ${socket.id} is not admin`);
 return;
 }

 const waiting = waitingRoom.get(roomId);
 if (!waiting) {
 console.log(`❌ No waiting room found for ${roomId}`);
 return;
 }
 
 const userIndex = waiting.findIndex(u => u.socketId === socketId);
 
 if (userIndex === -1) {
 console.log(`❌ User ${socketId} not found in waiting room`);
 return;
 }
 
 const user = waiting[userIndex];
 waiting.splice(userIndex, 1);
 console.log(`✅ Removed ${user.name} from waiting room`);

 // Add user to room
 const userSocket = io.sockets.sockets.get(socketId);
 if (!userSocket) {
 console.log(`❌ Socket ${socketId} not found - user may have disconnected`);
 return;
 }
 
 // JOIN THE SOCKET.IO ROOM FIRST!
 userSocket.join(roomId);
 console.log(`✅ ${user.name} joined Socket.IO room ${roomId}`);
 
 // Verify they're actually in the room
 const roomSockets = io.sockets.adapter.rooms.get(roomId);
 console.log(`   Socket.IO room ${roomId} now has ${roomSockets?.size || 0} sockets`);
 
 // Add to our tracking Map
 room.set(socketId, {
 id: socketId,
 name: user.name,
 userIdentifier: user.userIdentifier,
 isAdmin: false,
 isMuted: false,
 isVideoOff: false,
 isScreenSharing: false,
 });
 console.log(`✅ ${user.name} added to rooms Map. Room now has ${room.size} participants`);

 // Set default permissions
 permissions.set(socketId, {
 allowAudio: true,
 allowVideo: true,
 allowScreenShare: false,
 });

 // Get current participants (excluding the newly admitted user)
 const participants = Array.from(room.values()).filter(p => p.id !== socketId);
 console.log(`📋 Sending ${participants.length} existing participant(s) to ${user.name}:`);
 participants.forEach(p => console.log(`   - ${p.name} (${p.id})`));

 // Notify admitted user - THEY ARE NOW IN THE SOCKET.IO ROOM
 userSocket.emit('admitted', { roomId });
 userSocket.emit('existing-participants', participants);
 userSocket.emit('permissions', permissions.get(socketId));
 console.log(`✅ Sent admitted, existing-participants, and permissions to ${user.name}`);

 // Notify ALL OTHER participants (including admin) about the newly admitted user
 console.log(`📢 Broadcasting user-joined event for ${user.name} to ALL in room ${roomId} (except ${socketId})`);
 io.to(roomId).except(socketId).emit('user-joined', {
 id: socketId,
 name: user.name,
 isMuted: false,
 isVideoOff: false,
 isAdmin: false,
 });
 console.log(`✅ user-joined broadcast complete for ${user.name}`);

 console.log(`🎉 ${user.name} successfully admitted to room ${roomId}`);
 });

 // Admin deny user
 socket.on('deny-user', ({ roomId, socketId }) => {
 console.log(`🚫 Deny request: Admin attempting to deny ${socketId} from room ${roomId}`);
 const room = rooms.get(roomId);
 const participant = room?.get(socket.id);
 
 // Verify requester is admin
 if (!participant || !participant.isAdmin) {
 console.log(`   ❌ Requester ${socket.id} is not admin!`);
 return;
 }

 const waiting = waitingRoom.get(roomId);
 if (!waiting) {
 console.log(`   ❌ No waiting room found for ${roomId}`);
 return;
 }
 
 const userIndex = waiting.findIndex(u => u.socketId === socketId);
 
 if (userIndex !== -1) {
 const userName = waiting[userIndex].name;
 waiting.splice(userIndex, 1);
 
 const userSocket = io.sockets.sockets.get(socketId);
 if (userSocket) {
 userSocket.emit('join-denied', { message: 'The host denied your request to join the meeting' });
 console.log(`   ✅ Sent join-denied event to ${userName}`);
 }
 
 console.log(`   🚫 User ${userName} (${socketId}) denied access to room ${roomId}`);
 } else {
 console.log(`   ❌ User ${socketId} not found in waiting room`);
 }
 });

 // Permission management
 socket.on('set-permission', ({ roomId, targetSocketId, permission, value }) => {
 console.log(`🔐 Permission change: ${socket.id} setting ${permission}=${value} for ${targetSocketId} in ${roomId}`);
 const room = rooms.get(roomId);
 const requester = room?.get(socket.id);
 
 // Only admin can set permissions
 if (!requester || !requester.isAdmin) {
 console.log(`   ❌ Requester is not admin`);
 return;
 }

 const targetPerms = permissions.get(targetSocketId);
 if (targetPerms) {
 targetPerms[permission] = value;
 
 // Notify target user of permission change
 const targetSocket = io.sockets.sockets.get(targetSocketId);
 if (targetSocket) {
 targetSocket.emit('permissions', targetPerms);
 console.log(`   ✅ Sent updated permissions to ${targetSocketId}:`, targetPerms);
 } else {
 console.log(`   ❌ Target socket ${targetSocketId} not found`);
 }
 } else {
 console.log(`   ❌ No permissions found for ${targetSocketId}`);
 }
 });

 // Request permission (from participant to admin)
 socket.on('request-permission', ({ roomId, permission }) => {
 const room = rooms.get(roomId);
 const participant = room.get(socket.id);
 
 if (!participant) return;

 // Notify all admins
 room.forEach((p, participantSocketId) => {
 if (p.isAdmin) {
 io.to(participantSocketId).emit('permission-request', {
 socketId: socket.id,
 name: participant.name,
 permission,
 });
 }
 });

 console.log(`${participant.name} requested ${permission} in room ${roomId}`);
 });

 // WebRTC Signaling
 socket.on('offer', ({ to, offer, roomId }) => {
 console.log(`📞 WebRTC: Forwarding OFFER from ${socket.id} to ${to} in room ${roomId}`);
 const toSocket = io.sockets.sockets.get(to);
 if (toSocket) {
 toSocket.emit('offer', {
 from: socket.id,
 offer,
 });
 console.log(`   ✅ Offer delivered to ${to}`);
 } else {
 console.log(`   ❌ Target socket ${to} not found!`);
 }
 });

 socket.on('answer', ({ to, answer, roomId }) => {
 console.log(`📞 WebRTC: Forwarding ANSWER from ${socket.id} to ${to} in room ${roomId}`);
 const toSocket = io.sockets.sockets.get(to);
 if (toSocket) {
 toSocket.emit('answer', {
 from: socket.id,
 answer,
 });
 console.log(`   ✅ Answer delivered to ${to}`);
 } else {
 console.log(`   ❌ Target socket ${to} not found!`);
 }
 });

 socket.on('ice-candidate', ({ to, candidate, roomId }) => {
 const toSocket = io.sockets.sockets.get(to);
 if (toSocket) {
 toSocket.emit('ice-candidate', {
 from: socket.id,
 candidate,
 });
 }
 });

 socket.on('send-signal', ({ to, signal, from }) => {
 // Legacy support - can be removed if not used
 io.to(to).emit('receive-signal', { signal, from });
 });

 socket.on('return-signal', ({ to, signal }) => {
 io.to(to).emit('receiving-returned-signal', { signal, from: socket.id });
 });

 socket.on('chat-message', ({ roomId, message }) => {
 console.log(`💬 Chat message from ${message.senderName} in room ${roomId}`);
 console.log(`   Room has ${rooms.get(roomId)?.size || 0} participants`);
 const room = io.sockets.adapter.rooms.get(roomId);
 console.log(`   Socket.IO room has ${room?.size || 0} sockets`);
 io.to(roomId).emit('chat-message', message);
 });

 socket.on('toggle-audio', ({ roomId, isMuted }) => {
 const room = rooms.get(roomId);
 if (room && room.has(socket.id)) {
 const participant = room.get(socket.id);
 participant.isMuted = isMuted;
 io.to(roomId).emit('participant-audio-toggle', {
 id: socket.id,
 isMuted,
 });
 }
 });

 socket.on('toggle-video', ({ roomId, isVideoOff }) => {
 const room = rooms.get(roomId);
 if (room && room.has(socket.id)) {
 const participant = room.get(socket.id);
 participant.isVideoOff = isVideoOff;
 io.to(roomId).emit('participant-video-toggle', {
 id: socket.id,
 isVideoOff,
 });
 }
 });

 socket.on('screen-share-started', ({ roomId }) => {
 const room = rooms.get(roomId);
 if (room && room.has(socket.id)) {
 const participant = room.get(socket.id);
 participant.isScreenSharing = true;
 }
 socket.to(roomId).emit('user-screen-sharing', { userId: socket.id });
 });

 socket.on('screen-share-stopped', ({ roomId }) => {
 const room = rooms.get(roomId);
 if (room && room.has(socket.id)) {
 const participant = room.get(socket.id);
 participant.isScreenSharing = false;
 }
 socket.to(roomId).emit('user-stopped-screen-sharing', { userId: socket.id });
 });

 // Admin Controls
 socket.on('kick-user', ({ roomId, userId }) => {
 const room = rooms.get(roomId);
 if (!room) return;

 const admin = room.get(socket.id);
 if (!admin || !admin.isAdmin) {
 console.log('Kick attempt by non-admin');
 return;
 }

 // Notify the kicked user
 io.to(userId).emit('kicked-from-meeting', { 
 message: 'You have been removed from the meeting by the admin' 
 });

 // Notify admin that user was kicked (to update UI)
 socket.emit('user-kicked', { userId });

 // Remove from room
 room.delete(userId);
 socket.to(roomId).emit('user-left', { id: userId });
 
 console.log(`Admin ${socket.id} kicked user ${userId} from room ${roomId}`);
 });

 socket.on('force-stop-screenshare', ({ roomId, userId }) => {
 const room = rooms.get(roomId);
 if (!room) return;

 const admin = room.get(socket.id);
 if (!admin || !admin.isAdmin) {
 console.log('Force stop screenshare attempt by non-admin');
 return;
 }

 // Notify the user to stop screen sharing
 io.to(userId).emit('admin-stop-screenshare', { 
 message: 'Your screen share has been stopped by the admin' 
 });

 console.log(`Admin ${socket.id} stopped screenshare for user ${userId} in room ${roomId}`);
 });

 // Recording notifications
 socket.on('recording-started', ({ roomId }) => {
 socket.to(roomId).emit('recording-started');
 console.log(`Recording started in room ${roomId}`);
 });

 socket.on('recording-stopped', ({ roomId }) => {
 socket.to(roomId).emit('recording-stopped');
 console.log(`Recording stopped in room ${roomId}`);
 });

 socket.on('disconnect', () => {
 console.log('🔌 Client disconnected:', socket.id);
 
 // Clean up from rooms
 rooms.forEach((room, roomId) => {
 if (room.has(socket.id)) {
 const userName = room.get(socket.id)?.name || 'Unknown';
 console.log(`   👋 ${userName} left room ${roomId}`);
 room.delete(socket.id);
 
 // Notify remaining participants using io.to() to ensure delivery
 io.to(roomId).emit('user-left', { id: socket.id });
 console.log(`   📢 Broadcasted user-left event to room ${roomId} (${room.size} remaining)`);
 
 if (room.size === 0) {
 rooms.delete(roomId);
 waitingRoom.delete(roomId);
 // Schedule auto-delete after 5 minutes of no participants
 scheduleAutoDelete(roomId);
 console.log(`   🏠 Room ${roomId} is now empty. Scheduled for deletion in 5 minutes.`);
 }
 }
 });

 // Clean up from waiting rooms
 waitingRoom.forEach((waiting, roomId) => {
 const index = waiting.findIndex(u => u.socketId === socket.id);
 if (index !== -1) {
 waiting.splice(index, 1);
 console.log(`Removed ${socket.id} from waiting room ${roomId}`);
 }
 });

 // Clean up permissions
 permissions.delete(socket.id);
 });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
