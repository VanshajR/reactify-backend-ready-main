# Video Calling Web Application - Frontend

React-based frontend with WebRTC support for video calling.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the environment variables to point to your backend server

4. Start the development server:
```bash
npm run dev
```

## Features

- Create instant or scheduled meetings
- Join meetings with meeting ID
- Real-time video/audio with WebRTC
- Screen sharing
- Text chat
- Participant list
- Audio/video controls
- Admin controls for meeting creators
- Responsive design

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Socket.IO Client
- Simple Peer (WebRTC)
- React Router
- React Context API
- Shadcn UI Components

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # Shadcn UI components
│   │   ├── ChatPanel.tsx
│   │   ├── ParticipantsList.tsx
│   │   └── VideoGrid.tsx
│   ├── context/         # React Context providers
│   │   ├── MeetingContext.tsx
│   │   └── SocketContext.tsx
│   ├── pages/           # Page components
│   │   ├── Index.tsx
│   │   ├── CreateMeeting.tsx
│   │   ├── JoinMeeting.tsx
│   │   ├── VideoCall.tsx
│   │   └── MyMeetings.tsx
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   └── index.css        # Global styles & design system
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:5000)
- `VITE_SOCKET_URL` - Socket.IO server URL (default: http://localhost:5000)
