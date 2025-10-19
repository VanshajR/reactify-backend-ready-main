# Video Calling Backend Setup Guide

This backend requires Node.js and MongoDB to run. Follow these steps to set it up:

## Prerequisites

1. **Node.js** (v16 or higher): [Download here](https://nodejs.org/)
2. **MongoDB**: You have two options:
   - Install MongoDB locally: [Download here](https://www.mongodb.com/try/download/community)
   - Use MongoDB Atlas (cloud): [Sign up here](https://www.mongodb.com/cloud/atlas/register)

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/videocall
CLIENT_URL=http://localhost:8080
NODE_ENV=development
```

**For MongoDB Atlas (cloud):**
Replace the `MONGODB_URI` with your Atlas connection string:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/videocall?retryWrites=true&w=majority
```

### 3. Start MongoDB (if running locally)

**On macOS/Linux:**
```bash
mongod
```

**On Windows:**
```bash
"C:\Program Files\MongoDB\Server\<version>\bin\mongod.exe"
```

Or use MongoDB as a service (usually starts automatically after installation).

### 4. Start the Backend Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## Verify the Setup

1. Check if the server is running:
   - Open browser to `http://localhost:5000`
   - You should see Express server is running or CORS-related message

2. Check MongoDB connection:
   - Look for "MongoDB connected" in your console logs

3. Test API endpoints:
   ```bash
   # Create a test meeting
   curl -X POST http://localhost:5000/api/meetings \
     -H "Content-Type: application/json" \
     -d '{"meetingId":"test-123","title":"Test Meeting","createdBy":"Test User"}'
   ```

## Common Issues

### MongoDB Connection Error

**Error**: `MongooseError: The uri parameter to openUri() must be a string`

**Solution**: Make sure your `MONGODB_URI` is correctly set in `.env` file.

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solution**: Either:
- Kill the process using port 5000
- Change the `PORT` in your `.env` file

### CORS Errors

**Error**: CORS policy blocking requests

**Solution**: Update `CLIENT_URL` in `.env` to match your frontend URL

## Frontend Configuration

After starting the backend, update the frontend's `.env` file:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## Production Deployment

For production deployment, consider:

1. **Backend Hosting**: 
   - Render.com (easiest)
   - Railway.app
   - Heroku
   - AWS/DigitalOcean

2. **Database**:
   - MongoDB Atlas (recommended for production)

3. **Environment Variables**:
   - Set all environment variables in your hosting platform
   - Update `CLIENT_URL` to your production frontend URL

## Testing WebRTC

WebRTC requires HTTPS in production. For local testing:
- Use `localhost` (works with HTTP)
- For network testing, use tools like ngrok to create HTTPS tunnels

## Need Help?

- Check console logs for detailed error messages
- Ensure all dependencies are installed
- Verify MongoDB is running
- Check that all environment variables are set correctly
