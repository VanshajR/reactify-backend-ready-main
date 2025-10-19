# 🚀 Complete Deployment Guide - Reactify Video Call App

## 📋 Overview
This guide will walk you through deploying your video calling application to production. We'll deploy:
- **Frontend** → Vercel (recommended) or Netlify
- **Backend** → Railway (recommended), Render, or Heroku
- **Database** → MongoDB Atlas (already set up)

---

## 🎯 Quick Deployment Checklist

- [ ] MongoDB Atlas setup (✅ Already done)
- [ ] Deploy Backend to Railway/Render
- [ ] Deploy Frontend to Vercel/Netlify
- [ ] Update environment variables
- [ ] Test the live application

---

## 📦 Part 1: Backend Deployment

### Option A: Railway (Recommended - Easiest)

#### Step 1: Prepare Backend for Deployment

1. Your backend is already configured correctly in the `backend/` folder
2. Make sure `backend/package.json` has a start script:
   ```json
   "scripts": {
     "start": "node server.js",
     "dev": "nodemon server.js"
   }
   ```

#### Step 2: Deploy to Railway

1. **Sign up for Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub (recommended for easy deployment)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select your repository

3. **Configure Root Directory**
   - Railway should auto-detect your backend
   - If not, go to Settings → Set "Root Directory" to `backend`

4. **Add Environment Variables**
   - Go to your project → Variables tab
   - Add these variables:
   ```
   MONGODB_URI=mongodb+srv://vanshajraghuvanshi:WbuQar8XRcwWqMmG@cluster0.m5oau.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   PORT=5000
   NODE_ENV=production
   CLIENT_URL=https://your-frontend-url.vercel.app
   ```
   - Note: Update CLIENT_URL after deploying frontend

5. **Deploy**
   - Railway will automatically deploy
   - Copy your backend URL (e.g., `https://your-app.up.railway.app`)

---

### Option B: Render

1. **Sign up at [render.com](https://render.com)**

2. **Create New Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository

3. **Configure Service**
   - **Name**: reactify-backend
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Add Environment Variables**
   ```
   MONGODB_URI=your_mongodb_uri
   PORT=5000
   NODE_ENV=production
   CLIENT_URL=https://your-frontend-url.vercel.app
   ```

5. **Deploy** - Render will build and deploy automatically

---

## 🌐 Part 2: Frontend Deployment

### Option A: Vercel (Recommended - Best for React)

#### Step 1: Prepare Frontend

1. **Update Environment Variables**
   - Create/update `.env` in the root directory:
   ```env
   VITE_API_URL=https://your-backend-url.railway.app
   VITE_SOCKET_URL=https://your-backend-url.railway.app
   ```

2. **Test Build Locally**
   ```powershell
   npm run build
   ```
   Make sure there are no errors.

#### Step 2: Deploy to Vercel

##### Method 1: Vercel Dashboard (Easiest)

1. **Sign up at [vercel.com](https://vercel.com)**
   - Use GitHub authentication

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a Vite project

3. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Add Environment Variables**
   - In project settings → Environment Variables
   - Add:
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   VITE_SOCKET_URL=https://your-backend-url.railway.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Copy your frontend URL (e.g., `https://your-app.vercel.app`)

##### Method 2: Vercel CLI

```powershell
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: reactify-video-call
# - Directory: ./ (root)
# - Override settings? No

# Add environment variables via dashboard or CLI:
vercel env add VITE_API_URL
vercel env add VITE_SOCKET_URL

# Deploy to production
vercel --prod
```

---

### Option B: Netlify

1. **Sign up at [netlify.com](https://netlify.com)**

2. **Create New Site**
   - "Add new site" → "Import an existing project"
   - Connect to GitHub
   - Select your repository

3. **Build Settings**
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Branch**: main

4. **Environment Variables**
   - Go to Site settings → Environment variables
   - Add:
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   VITE_SOCKET_URL=https://your-backend-url.railway.app
   ```

5. **Deploy** - Netlify will build and deploy

---

## 🔄 Part 3: Final Configuration

### Update Backend CORS

1. **Update Backend Environment Variable**
   - Go to Railway/Render dashboard
   - Update `CLIENT_URL` with your actual frontend URL:
   ```
   CLIENT_URL=https://your-app.vercel.app
   ```

2. **Verify CORS in server.js** (already configured):
   ```javascript
   const corsOptions = {
     origin: process.env.CLIENT_URL || 'http://localhost:8080',
     credentials: true
   };
   ```

3. **Redeploy Backend** if needed

### Update Frontend URLs

1. **Vercel/Netlify Dashboard**
   - Update environment variables with final backend URL
   - Redeploy if necessary

---

## ✅ Part 4: Testing Your Deployment

### Test Checklist

1. **Frontend Access**
   - ✅ Visit your frontend URL
   - ✅ Check if homepage loads correctly
   - ✅ All images and styles load

2. **Create Meeting**
   - ✅ Click "Create Meeting"
   - ✅ Enter your name
   - ✅ Click "Start Meeting"
   - ✅ Camera and mic permissions work

3. **Join Meeting**
   - ✅ Copy meeting link
   - ✅ Open in new incognito window
   - ✅ Join meeting successfully
   - ✅ See other participant

4. **Test Features**
   - ✅ Video on/off toggle
   - ✅ Audio mute/unmute
   - ✅ Screen sharing
   - ✅ Chat functionality
   - ✅ Participant list

---

## 🔐 Part 5: Security & Best Practices

### MongoDB Security

1. **Whitelist IPs in MongoDB Atlas**
   - Go to Network Access
   - Add `0.0.0.0/0` for any IP (or specific IPs)

2. **Strong Password**
   - Use a strong database password
   - Never commit credentials to Git

### Environment Variables

- ✅ Never commit `.env` files
- ✅ Use platform-specific env variables
- ✅ Different keys for dev/production

### HTTPS

- ✅ Both Vercel and Railway provide HTTPS automatically
- ✅ Required for WebRTC to work properly

---

## 📊 Part 6: Monitoring & Maintenance

### Railway Dashboard
- Monitor server logs
- Check resource usage
- Set up notifications

### Vercel Dashboard
- Monitor deployment logs
- Analytics
- Domain management

### MongoDB Atlas
- Monitor database usage
- Set up alerts
- Backup configuration

---

## 🐛 Troubleshooting

### Issue: CORS Errors

**Solution**:
```javascript
// Verify backend CLIENT_URL matches frontend URL exactly
// No trailing slash
CLIENT_URL=https://your-app.vercel.app
```

### Issue: WebRTC Not Working

**Causes**:
- Not using HTTPS (both platforms provide this)
- Camera/mic permissions denied
- Firewall blocking WebRTC

**Solution**:
- Ensure HTTPS is enabled
- Check browser permissions
- Test in different browsers

### Issue: Socket Connection Failed

**Solution**:
```env
# Make sure VITE_SOCKET_URL is correct
VITE_SOCKET_URL=https://your-backend.railway.app
# No /socket.io at the end
```

### Issue: Build Fails

**Solution**:
```powershell
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

---

## 📝 Quick Reference

### Your URLs (Update these)

```
Frontend (Vercel): https://__________.vercel.app
Backend (Railway): https://__________.up.railway.app
MongoDB: mongodb+srv://... (already configured)
```

### Environment Variables Summary

**Frontend (.env)**:
```env
VITE_API_URL=https://your-backend-url.railway.app
VITE_SOCKET_URL=https://your-backend-url.railway.app
```

**Backend (Railway/Render)**:
```env
MONGODB_URI=mongodb+srv://vanshajraghuvanshi:...
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-frontend-url.vercel.app
```

---

## 🎉 Deployment Complete!

Once deployed, share your app:
```
🌐 Your App: https://your-app.vercel.app
```

### Next Steps:
- ⭐ Custom domain (optional)
- 📊 Analytics setup
- 🔔 Set up monitoring
- 📧 Add email notifications
- 🎨 Further customization

---

## 💰 Cost Breakdown

### Free Tier Limits:

**Railway**: 
- $5 free credit/month
- ~500 hours of runtime

**Vercel**:
- 100GB bandwidth/month
- Unlimited deployments

**Render**:
- 750 hours free/month
- Auto-sleep after 15min inactivity

**MongoDB Atlas**:
- 512MB storage (Free forever)
- Shared cluster

### Total Cost: **$0/month** for moderate usage! 🎉

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review deployment logs
3. Verify environment variables
4. Test locally first

**Good luck with your deployment! 🚀**
