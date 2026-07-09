---
noteId: "4cc490207b7011f18a5d59af61010ff6"
tags: []

---

# Debugging Your 404 Error

## Step 1: Check Vercel Build Logs
Go to your Vercel project → Deployments → Click your deployment → Click "Logs"

**Look for:**
- ❌ Build errors (red text)
- ✅ "Successfully compiled" message
- Check if `npm run build` completed

## Step 2: Verify the Build Locally
Run this in your frontend directory:

```bash
npm install  # Fresh install
npm run build
```

Check if a `dist/` folder was created with:
```bash
ls dist/
```

You should see:
```
index.html
assets/
  - index-XXX.js
  - index-XXX.css
```

## Step 3: Check Vercel Environment Variables
In Vercel Dashboard → Project Settings → Environment Variables

Make sure these are NOT marked as "Build-time only" (they should be "Production"):
- `VITE_API_BASE_URL`
- `VITE_SOCKET_URL`

Or leave them empty - the code now has smart defaults!

## Step 4: Verify vercel.json
Your `vercel.json` should have this structure:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "routes": [
    {
      "src": "/index.html",
      "dest": "/index.html"
    },
    {
      "src": "/assets/(.*)",
      "dest": "/assets/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html",
      "status": 200
    }
  ]
}
```

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| `dist/` doesn't exist | Build failed silently | Check npm install completed, run `npm run build` |
| `index.html` not in `dist/` | Vite config wrong | Verify `vite.config.js` has `build: { outDir: 'dist' }` |
| Environment variables not loading | Not set in Vercel | Check Vercel → Environment Variables |
| Pages work but assets missing | Routes wrong | Verify `/assets/(.*)` route in vercel.json |

## Nuclear Option: Reset Vercel
1. Delete current deployment
2. Go to Vercel → Deployments
3. Click "..." next to your deployment → "Delete"
4. Push a new commit to trigger rebuild
