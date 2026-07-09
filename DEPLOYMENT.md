# Deployment Guide

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account (free at https://vercel.com)
- GitHub repository with your code

### Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import Project to Vercel**
   - Go to https://vercel.com/dashboard
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Environment Variables**
   - In Vercel Dashboard → Project Settings → Environment Variables
   - Add these variables:
     ```
     VITE_API_BASE_URL=https://your-backend-url.com
     VITE_SOCKET_URL=https://your-backend-url.com
     ```

4. **Deploy**
   - Vercel automatically deploys on every `git push` to main
   - Your frontend will be live at `https://your-project.vercel.app`

---

## Backend Deployment Options

### Option 1: Railway (Recommended)
1. Go to https://railway.app
2. Sign up with GitHub
3. Create new project → "Deploy from GitHub"
4. Select your repository
5. Set these environment variables in Railway:
   ```
   NODE_ENV=production
   PORT=3000
   MONGO_URI=your-mongodb-connection-string
   JWT_SECRET=your-jwt-secret
   REFRESH_TOKEN_SECRET=your-refresh-secret
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   FRONTEND_URL=https://your-vercel-app.vercel.app
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```
6. Railway provides a public URL for your backend

### Option 2: Render
1. Go to https://render.com
2. Connect GitHub account
3. Create new "Web Service"
4. Select your repository
5. Configure same environment variables as above
6. Deploy

### Option 3: Heroku
1. Go to https://www.heroku.com
2. Create account
3. Create new app
4. Connect to GitHub repo
5. Set environment variables in Heroku Dashboard
6. Enable automatic deployments

---

## Database Setup

### MongoDB Atlas (Cloud MongoDB)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create account
3. Create cluster (free tier available)
4. Get connection string
5. Use this for `MONGO_URI` in production environment

---

## Update Backend URL in Frontend

After deploying backend, update the environment variable in Vercel:

**Vercel Dashboard:**
- Project Settings → Environment Variables
- Update `VITE_API_BASE_URL` to your deployed backend URL
- Example: `https://anthola-backend.railway.app`

Then redeploy by pushing a commit to GitHub.

---

## Testing Deployment

1. Visit your Vercel frontend URL
2. Try signing up with a new email
3. Check that API calls go to your backend
4. Verify email password reset works
5. Test real-time socket connections

---

## Troubleshooting

**CORS errors?**
- Make sure `CORS_ORIGIN` on backend matches your Vercel frontend URL
- Restart backend after changing env vars

**API requests failing?**
- Verify `VITE_API_BASE_URL` is correct and includes protocol (https://)
- Check backend logs for errors

**WebSocket not connecting?**
- Ensure `VITE_SOCKET_URL` points to correct backend URL
- Some hosting providers may require additional WebSocket configuration

---

## Quick Checklist

- [ ] Frontend pushed to GitHub
- [ ] Vercel project created and deployed
- [ ] Backend deployed to Railway/Render/Heroku
- [ ] MongoDB Atlas cluster created
- [ ] Environment variables set in both Vercel and backend hosting
- [ ] CORS_ORIGIN updated to match Vercel URL
- [ ] API calls tested from deployed frontend
- [ ] Email reset working with production email setup
