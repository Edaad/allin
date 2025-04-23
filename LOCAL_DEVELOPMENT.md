# Local Development Setup Guide

This guide will help you set up the All In Poker application to run locally on your machine, allowing you to test both frontend and backend changes without deploying to production.

## Prerequisites

- Node.js and npm installed on your machine
- Git installed and configured
- Access to the project's MongoDB database
- Code editor (VS Code recommended)

## Initial Setup

1. Clone the repository (if you haven't already):
   ```bash
   git clone <repository-url>
   cd allin
   ```

2. Pull the latest changes:
   ```bash
   git pull origin main
   ```

## Backend Setup

1. Navigate to the server directory and install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Create a `.env` file in the server directory with the following content:
   ```
   MONGO_URI=mongodb+srv://admin:admin@allin.xq3ezsf.mongodb.net/poker
   JWT_SECRET=allin_poker_jwt_secret_key_2024_secure_random_string
   PORT=3001
   ```

   > Note: This will connect to the shared development database. Any changes you make will be visible to all team members.

## Frontend Setup

1. Navigate to the client directory and install dependencies:
   ```bash
   cd ../client
   npm install
   ```

2. Create a `.env.development.local` file in the client directory with:
   ```
   REACT_APP_API_URL=http://localhost:3001
   ```

   > Note: This file ensures your frontend connects to your local backend server instead of the production server.

## Running the Application

You'll need two terminal windows to run both the frontend and backend servers.

### Terminal 1 (Backend):
```bash
cd server
npm start
```

You should see:
- "Server is running on port 3001"
- "Connected to MongoDB"

### Terminal 2 (Frontend):
```bash
cd client
npm start
```

The frontend will automatically open in your browser at `http://localhost:3000`

## Verifying the Setup

To confirm everything is working correctly:

1. Open Chrome DevTools (F12 or right-click -> Inspect)
2. Go to the Network tab
3. Click the "Fetch/XHR" filter
4. Perform any action in the app (e.g., view the community page)
5. Look for requests to `http://localhost:3001` - this confirms you're using your local backend

## Development Workflow

- Backend changes will automatically reload thanks to nodemon
- Frontend changes will automatically reload in the browser
- You can now test backend changes without pushing to the deploy branch
- The MongoDB database is shared, so you can see real data

## Troubleshooting

If you encounter issues:

1. **Backend won't start:**
   - Check if port 3001 is already in use
   - Verify MongoDB connection string
   - Make sure all dependencies are installed

2. **Frontend can't connect to backend:**
   - Verify backend is running on port 3001
   - Check `.env.development.local` file exists
   - Clear browser cache and reload

3. **Changes not reflecting:**
   - Backend: Try manually restarting the server
   - Frontend: Hard refresh the browser (Ctrl/Cmd + Shift + R)

## Need Help?

If you encounter any issues not covered here, please reach out to the team for assistance. 