# Reactify Backend - Railway/Render Deployment

## For Railway:
- Automatically detects Node.js and runs `npm start`
- Set environment variables in Railway dashboard

## For Render:
- Build Command: `npm install`
- Start Command: `npm start`
- Set environment variables in Render dashboard

## Environment Variables Required:
- MONGODB_URI
- PORT (optional, will use Railway/Render's default)
- NODE_ENV=production
