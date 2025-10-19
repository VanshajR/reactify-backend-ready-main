# 🎥 Reactify - Professional Video Calling Application

A modern, full-featured video conferencing application built with React, TypeScript, Node.js, Socket.IO, and WebRTC. Production-ready with admin controls, meeting recording, notification sounds, and auto-cleanup features.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### Core Features
- 🎥 **HD Video Calls** - Crystal-clear video with WebRTC peer-to-peer streaming
- 🎙️ **Audio Control** - Mute/unmute with visual indicators and real-time sync
- 📹 **Camera Toggle** - Turn camera on/off during calls with proper track management
- 🖥️ **Screen Sharing** - Share your screen with all participants
- 💬 **Real-time Chat** - Built-in messaging system with notification sounds
- 👥 **Multi-participant Support** - Connect unlimited users in one meeting
- 🔒 **Password Protection** - Secure your meetings with optional passwords
- 📅 **Schedule Meetings** - Create future meetings with database persistence
- 📱 **Responsive Design** - Optimized UI that fits perfectly on all screen sizes
- 🌙 **Modern Dark UI** - Beautiful slate/blue/purple gradient design theme

### Advanced Features
- 👑 **Admin Controls** - Meeting creator can kick users and stop screen shares
- 🎬 **Meeting Recording** - Admin can record meetings and download as WebM files
- 🔔 **Notification Sounds** - Audio alerts for user join/leave and new messages
- � **Sound Toggle** - Disable/enable notification sounds with one click
- ⚡ **Auto-Delete Meetings** - Empty meetings auto-delete after 5 minutes
- 📋 **My Meetings Dashboard** - View, manage, join, and delete your meetings
- 🗑️ **Bulk Delete** - Delete all your meetings at once
- ⚙️ **Join Preferences** - Choose to join with audio/video muted or enabled
- 🎨 **Custom Scrollbar** - Beautiful gradient scrollbar matching the theme

## �🚀 Quick Start

### Prerequisites

- **Node.js** v16 or higher ([Download](https://nodejs.org/))
- **MongoDB Atlas** account ([Sign up free](https://www.mongodb.com/cloud/atlas))
- **npm** or **yarn** package manager
- Modern web browser with WebRTC support (Chrome, Firefox, Edge, Safari)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd reactify-backend-ready-main
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Set up MongoDB Atlas**
   - Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Click "Connect" → "Connect your application"
   - Copy the connection string (e.g., `mongodb+srv://username:password@cluster.mongodb.net/reactify?retryWrites=true&w=majority`)
   - Replace `<password>` with your database password

4. **Set up environment variables**

   **Backend** (`backend/.env`):
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/reactify?retryWrites=true&w=majority
   CLIENT_URL=http://localhost:8080
   NODE_ENV=development
   ```

   **Frontend** (`.env`):
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_SOCKET_URL=http://localhost:5000
   ```

5. **Start the servers**

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   Backend will start on `http://localhost:5000`

   **Terminal 2 - Frontend:**
   ```bash
   npm run dev
   ```
   Frontend will start on `http://localhost:8080`

6. **Open your browser**
   - Navigate to `http://localhost:8080`
   - Create a meeting or join an existing one
   - Allow camera/microphone permissions when prompted

## 📖 Complete User Guide

### Creating a Meeting
1. Click **"Create Meeting"** on the home page
2. Enter a meeting title (e.g., "Team Standup")
3. (Optional) Set a password for security
4. (Optional) Schedule for a future date/time
5. Choose audio/video preferences (start muted/unmuted)
6. Click **"Create Meeting"**
7. You'll be redirected to the meeting as the **Admin** (👑)

### Joining a Meeting
1. Click **"Join Meeting"** on the home page
2. Enter the Meeting ID (or paste the full meeting link)
3. Enter your name
4. (Optional) Enter password if meeting is protected
5. Choose audio/video preferences
6. Click **"Join Meeting"**

### During the Meeting

#### Basic Controls
- **Microphone Button**: Toggle audio mute/unmute
- **Camera Button**: Toggle video on/off
- **Screen Share Button**: Share your screen (one user at a time)
- **Leave Button**: Exit the meeting

#### Admin-Only Controls
- **Recording Button** (⭕/⏹️): Start/stop meeting recording
  - Downloads automatically as `.webm` file when stopped
  - Only admin can record
- **Kick User**: In Participants list, click ❌ next to any user to remove them
- **Stop Screen Share**: In Participants list, click 🖥️❌ to stop someone's screen share

#### Side Panels
- **Chat Icon** 💬: Open/close real-time chat
  - Send messages to all participants
  - Hear notification sound for new messages
- **Participants Icon** 👥: View all participants
  - See who's muted/camera off
  - See who's the admin (👑 icon)
  - Admin controls appear here
- **Sound Icon** 🔊/🔇: Toggle notification sounds on/off

### Managing Your Meetings
1. Click **"My Meetings"** on the home page
2. View all your created meetings
3. **Copy Link**: Click to copy meeting URL to clipboard
4. **Join as Admin**: Rejoin your own meeting with admin privileges
5. **Delete**: Remove a single meeting
6. **Delete All**: Remove all your meetings at once

## 🏗️ Project Structure

```
reactify-backend-ready-main/
├── backend/                      # Express + Socket.IO backend
│   ├── server.js                # Main server with Socket.IO events
│   ├── models/                  # MongoDB Mongoose models
│   │   └── Meeting.js          # Meeting schema
│   ├── routes/                  # Express API routes
│   │   └── meetings.js         # Meeting CRUD operations
│   ├── .env                     # Backend environment variables
│   └── package.json            # Backend dependencies
│
├── src/                         # React TypeScript frontend
│   ├── components/              # Reusable components
│   │   ├── ui/                 # shadcn/ui components (40+ components)
│   │   ├── VideoGrid.tsx       # Video layout with grid/screen share
│   │   ├── ChatPanel.tsx       # Real-time chat interface
│   │   └── ParticipantsList.tsx # Participant list with admin controls
│   │
│   ├── pages/                   # Page components
│   │   ├── Index.tsx           # Landing page with nav
│   │   ├── CreateMeeting.tsx   # Meeting creation form
│   │   ├── JoinMeeting.tsx     # Join meeting form
│   │   ├── VideoCall.tsx       # Main video call interface
│   │   ├── MyMeetings.tsx      # Meetings dashboard
│   │   └── NotFound.tsx        # 404 page
│   │
│   ├── context/                 # React Context providers
│   │   ├── MeetingContext.tsx  # Meeting state management
│   │   └── SocketContext.tsx   # Socket.IO connection
│   │
│   ├── utils/                   # Utility functions
│   │   └── notifications.ts    # Notification sounds (Web Audio API)
│   │
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility functions
│   └── App.tsx                  # Main app with routing
│
├── .env                         # Frontend environment variables
├── package.json                 # Frontend dependencies
├── vite.config.ts              # Vite configuration
├── tailwind.config.ts          # Tailwind CSS config
├── tsconfig.json               # TypeScript config
├── README.md                    # This file
├── SETUP_GUIDE.md              # Detailed setup guide
└── DEPLOYMENT_GUIDE.md         # Production deployment guide
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **WebRTC** - Native peer-to-peer video/audio streaming (no third-party services!)
- **Socket.IO Client** - Real-time bidirectional communication
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful icon library
- **React Router** - Client-side routing

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Minimalist web framework
- **Socket.IO** - WebSocket server for signaling and real-time features
- **MongoDB** - NoSQL database (via MongoDB Atlas)
- **Mongoose** - Elegant MongoDB ODM
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### WebRTC Architecture
- **Peer-to-peer connections** - Direct media streaming between browsers
- **Socket.IO signaling** - Exchange SDP offers/answers and ICE candidates
- **MediaStream API** - Access camera/microphone
- **MediaRecorder API** - Record meeting audio/video
- **getUserMedia / getDisplayMedia** - Screen sharing support

## 🎨 Features Breakdown

### Video Call Interface
- **Grid layout** - Automatic arrangement for 1-20+ participants
- **Picture-in-picture** - Dedicated section for screen sharing
- **Visual indicators** - Red badges for muted audio/video
- **Admin crown icon** - See who created the meeting
- **Screen share indicator** - Icon shows who's sharing
- **Smooth animations** - Tailwind transitions for all interactions

### Chat System
- **Real-time delivery** - Instant message sync via Socket.IO
- **Message bubbles** - Different colors for you vs others
- **Timestamps** - Track conversation timeline
- **Auto-scroll** - Scroll to bottom on new messages
- **Notification sound** - Beep when receiving messages (toggleable)
- **Sender names** - See who sent each message

### Meeting Management
- **Unique meeting IDs** - UUID-based identification
- **Database persistence** - MongoDB stores all meetings
- **Password protection** - Bcrypt-hashed passwords (coming soon)
- **Scheduled meetings** - Future date/time support
- **Auto-delete** - Empty meetings deleted after 5 minutes
- **Copy meeting links** - One-click URL copy
- **Bulk operations** - Delete all meetings at once

### Admin Controls (Meeting Creator)
- **Kick participants** - Remove disruptive users from meeting
- **Force stop screen share** - Stop anyone's screen share remotely
- **Meeting recording** - Record entire meeting with download
- **Admin badge** - Crown icon shows your authority
- **Exclusive controls** - Only admin sees recording/kick buttons

### Notification System
- **User joined** - 800Hz sine tone (0.15s)
- **User left** - 400Hz sine tone (0.15s)
- **New message** - 600Hz square tone (0.08s)
- **Web Audio API** - No external audio files needed
- **Toggleable** - Mute/unmute with volume button
- **Non-intrusive** - Short, pleasant sounds

## 🔧 Available Scripts

### Frontend
```bash
npm run dev          # Start Vite dev server on port 8080
npm run build        # Build production bundle to dist/
npm run preview      # Preview production build locally
npm run lint         # Run ESLint on all TypeScript files
```

### Backend
```bash
npm run dev          # Start with nodemon (auto-restart on changes)
npm start            # Start production server
```

## 🌐 Production Deployment

Your app can be deployed for **100% FREE** using:

### Frontend (Choose one)
- **[Vercel](https://vercel.com)** ⭐ Recommended
  - Automatic builds from Git
  - Edge network for global performance
  - Custom domains included
  
- **[Netlify](https://netlify.com)**
  - Similar to Vercel
  - Great for static sites
  - Instant rollbacks

### Backend (Choose one)
- **[Railway](https://railway.app)** ⭐ Recommended
  - $5 free credit monthly
  - Easy MongoDB connection
  - Auto-deploy from Git
  
- **[Render](https://render.com)**
  - Free tier available
  - Simple setup
  - Health checks included

### Database
- **[MongoDB Atlas](https://mongodb.com/cloud/atlas)** ⭐ Required
  - 512MB free tier (enough for 1000s of meetings)
  - Global clusters
  - Automatic backups

**See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete step-by-step instructions.**

## � Environment Variables Reference

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `CLIENT_URL` | Frontend URL (for CORS) | `http://localhost:8080` |
| `NODE_ENV` | Environment mode | `development` or `production` |

### Frontend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000` |
| `VITE_SOCKET_URL` | Socket.IO server URL | `http://localhost:5000` |

## 🐛 Troubleshooting

### Camera/Microphone Not Working
- **Check browser permissions**: Click the lock icon in address bar
- **Use HTTPS**: WebRTC requires secure context (localhost is OK for dev)
- **Check other apps**: Close Zoom, Teams, etc. that might block access
- **Try different browser**: Chrome/Edge have best WebRTC support

### Socket.IO Connection Failed
- **Check backend is running**: Should see "Server running on port 5000"
- **Verify CORS settings**: `CLIENT_URL` in backend `.env` must match frontend URL
- **Check firewall**: Allow port 5000 on your system
- **Network issues**: Some corporate networks block WebSockets

### MongoDB Connection Error
- **Whitelist IP**: In MongoDB Atlas, add `0.0.0.0/0` to IP whitelist
- **Check credentials**: Username/password in connection string must be correct
- **Database name**: Ensure database name is in the connection string
- **Network**: Some networks block MongoDB Atlas (try mobile hotspot)

### Video Not Displaying
- **Reload page**: Sometimes WebRTC needs a fresh start
- **Check console**: Open DevTools (F12) and look for errors
- **Peer connection**: Both users must have proper network connectivity
- **NAT/Firewall**: Some routers block peer-to-peer (try different network)

### Screen Share Black Screen
- **Select correct window**: Make sure you chose the right tab/window
- **Browser permission**: Allow screen recording permission
- **Hardware acceleration**: Enable in browser settings
- **Try different source**: Share entire screen instead of specific tab

## 🎯 Roadmap & Future Features

### Planned (Coming Soon)
- [ ] Email reminders for scheduled meetings
- [ ] Dark/light mode toggle
- [ ] Virtual backgrounds with canvas API
- [ ] Hand raise feature
- [ ] Reactions/emojis during calls
- [ ] Waiting room for participants
- [ ] Breakout rooms

### Under Consideration
- [ ] End-to-end encryption
- [ ] Whiteboard/collaborative drawing
- [ ] Calendar integration (Google, Outlook)
- [ ] Mobile app (React Native)
- [ ] AI transcription/captions
- [ ] Cloud recording storage
- [ ] Analytics dashboard

## � Bug Fixes & Updates

### Version 2.0.0 (Latest)
✅ **Admin Controls**: Kick users, stop screen shares  
✅ **Meeting Recording**: MediaRecorder with WebM download  
✅ **Notification Sounds**: Web Audio API for join/leave/chat  
✅ **Sound Toggle**: Mute/unmute notification sounds  
✅ **Screen Share Tracking**: Real-time indicator for who's sharing  
✅ **Participant State Sync**: Audio/video toggles update across all users  

### Version 1.5.0
✅ **Auto-Delete**: Empty meetings cleaned up after 5 minutes  
✅ **UI Fitting**: All pages fit on screen without scrolling  
✅ **Join Preferences**: Start with audio/video muted or enabled  
✅ **Delete All**: Bulk delete meetings in My Meetings  
✅ **Custom Scrollbar**: Beautiful gradient scrollbar  

### Version 1.0.0
✅ Fixed camera toggle - now properly turns back on  
✅ Fixed deleted meeting access via direct URL  
✅ Fixed screen share cancellation error messages  
✅ Fixed meeting ID whitespace handling  
✅ Updated all page styling to modern dark theme  

## �📝 License

MIT License - feel free to use this project for personal or commercial purposes.

```
Copyright (c) 2024 Reactify

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 💖 Acknowledgments

- Built with modern web technologies and best practices
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Inspired by Zoom, Google Meet, and Microsoft Teams
- Thanks to the WebRTC and Socket.IO communities

## 📞 Support & Contact

- 🐛 **Report bugs**: [Open an issue](../../issues)
- 💡 **Feature requests**: [Discussions](../../discussions)
- 📧 **Email**: your-email@example.com
- 🌐 **Website**: https://your-website.com

---

**Made with ❤️ for seamless virtual collaboration**

🌐 **Live Demo**: [Add your deployment URL here]

⭐ **Star this repo** if you find it helpful!

🔥 **Perfect for**: Remote teams, online classes, tech interviews, webinars, virtual events
