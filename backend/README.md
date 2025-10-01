# Render Deployment Guide

## Setup Instructions

### 1. Environment Variables (Required)
Set these in your Render dashboard:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/myinvestments
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
FRONTEND_URL=https://yourusername.github.io/MyInvestments
```

### 2. Build Command
```
npm install
```

### 3. Start Command
```
npm start
```

### 4. Auto-Deploy
Connect your GitHub repository for automatic deployments on every push.

## Database Setup (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist IP addresses (0.0.0.0/0 for all IPs)
5. Get connection string and add to MONGODB_URI

## Security Notes

- JWT_SECRET should be at least 32 characters long
- Use strong passwords for MongoDB
- Keep environment variables secure
- Enable MongoDB Atlas network access restrictions if possible

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- GET /api/auth/profile - Get user profile
- PUT /api/auth/profile - Update user profile
- PUT /api/auth/change-password - Change password
- POST /api/auth/logout - Logout user

### Investments
- GET /api/investments - Get all investments
- POST /api/investments - Create investment
- GET /api/investments/:id - Get specific investment
- PUT /api/investments/:id - Update investment
- DELETE /api/investments/:id - Delete investment
- GET /api/investments/stats/summary - Get portfolio summary

### Dividends
- GET /api/dividends - Get all dividends
- POST /api/dividends - Create dividend
- GET /api/dividends/investment/:id - Get dividends for investment
- PUT /api/dividends/:id - Update dividend
- DELETE /api/dividends/:id - Delete dividend
- GET /api/dividends/stats - Get dividend statistics

### Divestments
- GET /api/divestments - Get all divestments
- POST /api/divestments - Create divestment
- GET /api/divestments/investment/:id - Get divestments for investment
- PUT /api/divestments/:id - Update divestment
- DELETE /api/divestments/:id - Delete divestment
- GET /api/divestments/stats - Get divestment statistics

## Frontend Integration

Your frontend will need to be updated to use these API endpoints instead of localStorage.
The base URL for API calls should be: `https://your-render-app-name.onrender.com/api`
