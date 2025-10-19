# Video Calling Backend

Express.js backend with MongoDB and Socket.IO for WebRTC signaling.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Make sure MongoDB is running locally or update `MONGODB_URI` in `.env`

4. Start the server:
```bash
npm run dev
```

## API Endpoints

### Meetings
- `POST /api/meetings` - Create a new meeting
- `GET /api/meetings/user/:userName` - Get all meetings for a user
- `GET /api/meetings/:meetingId` - Get specific meeting details
- `POST /api/meetings/:meetingId/verify` - Verify meeting password
- `POST /api/meetings/:meetingId/participants` - Add participant to meeting
- `DELETE /api/meetings/:meetingId` - Delete a meeting

## Socket.IO Events

### Client to Server
- `create-room` - Create a new room
- `join-room` - Join an existing room
- `send-signal` - Send WebRTC signal to peer
- `return-signal` - Return WebRTC signal
- `chat-message` - Send chat message
- `toggle-audio` - Toggle audio mute
- `toggle-video` - Toggle video
- `screen-share-started` - Start screen sharing
- `screen-share-stopped` - Stop screen sharing

### Server to Client
- `room-created` - Room creation confirmation
- `user-joined` - New user joined the room
- `existing-participants` - List of existing participants
- `receive-signal` - Receive WebRTC signal
- `receiving-returned-signal` - Receive returned signal
- `chat-message` - Receive chat message
- `participant-audio-toggle` - Participant toggled audio
- `participant-video-toggle` - Participant toggled video
- `user-screen-sharing` - User started screen sharing
- `user-stopped-screen-sharing` - User stopped screen sharing
- `user-left` - User left the room
