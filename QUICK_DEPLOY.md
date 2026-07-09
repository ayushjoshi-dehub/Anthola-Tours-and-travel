---
noteId: "19f503b07b6f11f18a5d59af61010ff6"
tags: []

---

# Quick Start: Deploy to Vercel + Railway

This guide gets your app live in 15 minutes.

## Frontend on Vercel (5 minutes)

1. **Commit your code**
   ```bash
   git add .
   git commit -m "Deploy: ready for production"
   git push origin main
   ```

2. **Import to Vercel**
   - Visit https://vercel.com/dashboard
   - Click "Add New" → "Project"
   - Select your GitHub repo
   - Click "Import"
   - Vercel auto-detects it's a Vite app ✅

3. **Set Environment Variables** (optional for now)
   - Leave blank for localhost testing
   - Update later after backend is deployed

4. **Deploy** 
   - Click "Deploy" 
   - Wait 2-3 minutes
   - Your app is live! 🎉

---

## Backend on Railway (5 minutes)

1. **Create Railway Account**
   - Visit https://railway.app
   - Sign up with GitHub

2. **Deploy Backend**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repo
   - Railway detects Node.js automatically

3. **Add Environment Variables**
   In Railway Dashboard → Variables, add:
   ```
   NODE_ENV=production
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/anthola
   JWT_SECRET=your-secret-key-here
   REFRESH_TOKEN_SECRET=your-refresh-secret
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   FRONTEND_URL=https://your-vercel-app.vercel.app
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

4. **Get Your Backend URL**
   - Railway generates a public URL (e.g., `https://anthola-backend.up.railway.app`)
   - Copy this URL

---

## Connect Frontend to Backend (2 minutes)

1. **Update Vercel Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add new variable:
     ```
     VITE_API_BASE_URL=https://your-railway-backend-url.up.railway.app
     VITE_SOCKET_URL=https://your-railway-backend-url.up.railway.app
     ```

2. **Redeploy**
   - Push a commit to trigger redeployment:
     ```bash
     git add .
     git commit -m "Update backend URL"
     git push origin main
     ```
   - Vercel redeploys automatically

---

## MongoDB Setup (First Time Only)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster (M0 free tier)
4. Get connection string
5. Use for `MONGO_URI` in Railway

**Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/anthola?retryWrites=true&w=majority
```

---

## Test Your Deployment

1. Visit `https://your-app.vercel.app`
2. Try signup with new email
3. Check that password reset email works
4. Verify real-time notifications

---

## URLs After Deployment

| Service | URL |
|---------|-----|
| **Frontend** | https://your-project.vercel.app |
| **Backend** | https://your-project.up.railway.app |
| **MongoDB** | mongodb+srv://... (Atlas) |

---

## Common Issues & Fixes

### "CORS error" 
→ Update `CORS_ORIGIN` in Railway to match your Vercel URL

### "Can't connect to API"
→ Make sure `VITE_API_BASE_URL` is set correctly in Vercel

### "MongoDB connection failed"
→ Whitelist Vercel/Railway IPs in MongoDB Atlas Network Access

### "Email not sending"
→ Use Gmail app password, enable less secure apps, or use SendGrid

---

## Next Steps

- ✅ Done with basic deployment? 
- Add custom domain (Vercel → Domains)
- Set up CI/CD for automatic deployments
- Monitor logs (Railway/Vercel dashboard)
- Set up alerts for errors

**Questions?** Check `DEPLOYMENT.md` for detailed instructions.
