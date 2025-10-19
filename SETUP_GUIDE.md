# Reactify Video Call Application - Setup & Deployment Guide

## 📋 Project Overview
A full-stack video calling application with:
- **Frontend**: React + TypeScript + Vite + WebRTC
- **Backend**: Express + Socket.IO + MongoDB
- **Features**: Video calls, chat, screen sharing, meeting management

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB URI (MongoDB Atlas or local MongoDB)
- npm or yarn

### Step 1: Configure Environment Variables

#### Backend Environment (.env in `backend/` folder)
```env
MONGODB_URI=your_mongodb_connection_string_here
PORT=5000
NODE_ENV=development
```

#### Frontend Environment (.env in root folder)
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### Step 2: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ..
npm install
```

### Step 3: Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will run on: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Frontend will run on: http://localhost:8080

### Step 4: Access the Application
Open your browser and navigate to: http://localhost:8080

---

## 🌐 Production Deployment

### Backend Deployment (Railway/Render/Heroku)

#### Option A: Railway
1. Create account at [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Set root directory to `backend`
5. Add environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `PORT`: 5000
   - `NODE_ENV`: production
6. Railway will auto-deploy

#### Option B: Render
1. Create account at [Render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: reactify-backend
   - **Root Directory**: backend
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables in Render dashboard
6. Deploy

#### Option C: Heroku
```bash
cd backend
heroku create your-app-name
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set NODE_ENV=production
git subtree push --prefix backend heroku main
```

**Note Your Backend URL**: After deployment, note the URL (e.g., `https://your-app.railway.app`)

---

### Frontend Deployment (Vercel/Netlify)

#### Option A: Vercel (Recommended)
1. Install Vercel CLI (optional):
   ```bash
   npm install -g vercel
   ```

2. Update `.env` with production backend URL:
   ```env
   VITE_API_URL=https://your-backend-url.railway.app
   VITE_SOCKET_URL=https://your-backend-url.railway.app
   ```

3. Deploy via Vercel Dashboard:
   - Go to [Vercel.com](https://vercel.com)
   - Import your repository
   - Set root directory to `.` (root)
   - Add environment variables:
     - `VITE_API_URL`: Your backend URL
     - `VITE_SOCKET_URL`: Your backend URL
   - Deploy

4. Or deploy via CLI:
   ```bash
   vercel
   ```

#### Option B: Netlify
1. Create `netlify.toml` in root:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. Deploy:
   - Go to [Netlify.com](https://netlify.com)
   - Import repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables
   - Deploy

---

## 🔧 Important Configuration Updates for Production

### 1. Update Backend CORS (already done)
The `backend/server.js` has been configured to accept your frontend domain.

**After deploying frontend**, update the CORS origin:
```javascript
const corsOptions = {
  origin: ['https://your-frontend-url.vercel.app', 'http://localhost:8080'],
  credentials: true
};
```

### 2. Update MongoDB Connection
Use MongoDB Atlas for production:
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist IP addresses (use `0.0.0.0/0` for any IP)
5. Get connection string and add to backend environment variables

---

## 📝 Quick Start Checklist

- [ ] Get MongoDB URI (Atlas or local)
- [ ] Update `backend/.env` with MongoDB URI
- [ ] Update `.env` with API URLs
- [ ] Run `npm install` in backend folder
- [ ] Run `npm install` in root folder
- [ ] Start backend server (`cd backend && npm run dev`)
- [ ] Start frontend server (`npm run dev`)
- [ ] Test the application at http://localhost:8080

---

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB URI is correct
- Check network access in MongoDB Atlas (whitelist IP)
- Ensure database user has read/write permissions

### CORS Errors
- Verify `VITE_API_URL` and `VITE_SOCKET_URL` in frontend `.env`
- Check backend CORS configuration matches frontend URL
- Clear browser cache and restart servers

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Kill frontend port (8080)
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### WebRTC Connection Issues
- Ensure using HTTPS in production (required for WebRTC)
- Check browser permissions for camera/microphone
- Verify STUN/TURN server configuration if behind strict firewalls

---

## 📦 Project Scripts

### Backend
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

### Frontend
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

---

## 🔐 Security Considerations

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use strong MongoDB passwords**
3. **Enable MongoDB IP whitelisting** in production
4. **Use HTTPS in production** for WebRTC functionality
5. **Add rate limiting** for API endpoints (consider implementing)
6. **Validate user inputs** on both frontend and backend

---

## 📚 Additional Resources

- [MongoDB Atlas Setup Guide](https://docs.atlas.mongodb.com/getting-started/)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Railway Deployment Docs](https://docs.railway.app/)
- [WebRTC Documentation](https://webrtc.org/getting-started/overview)
- [Socket.IO Documentation](https://socket.io/docs/v4/)

---

## 🆘 Need Help?

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Check server logs for error messages
4. Ensure all dependencies are installed correctly

---

**Note**: Once you have your MongoDB URI, update the `backend/.env` file and you'll be ready to run the application locally!
