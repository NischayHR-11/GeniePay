# 🚀 Deployment Guide for GeniePay

## Current Deployment URLs
- **Frontend:** https://geniepay.nischay.tech
- **Backend:** https://geniepay.onrender.com

---

## 🎯 How It Works

### Local Development
- Frontend connects to: `http://localhost:5000`
- Backend allows: `http://localhost:5173`, `http://localhost:5174`

### Production
- Frontend connects to: `https://geniepay.onrender.com`
- Backend allows: `https://geniepay.nischay.tech`

---

## 📦 Backend Deployment (Render)

### 1. Configure Render Service
```
Root Directory: backend
Build Command: npm install
Start Command: node server.js
```

### 2. Environment Variables
Add these in Render Dashboard:

```env
MONGO_URI=mongodb+srv://nischayhr11:Nischay1@cluster0.6p9g1.mongodb.net/GeniePay?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=geniepay_thor_secret_key_2025_production_change_this_secure
PORT=5000
NODE_ENV=production
CLIENT_URL=https://geniepay.nischay.tech
OPENAI_API_KEY=sk-your-openai-api-key (optional)
EMAIL_HOST=smtp.gmail.com (optional)
EMAIL_PORT=587 (optional)
EMAIL_USER=your-email@gmail.com (optional)
EMAIL_PASSWORD=your-app-password (optional)
```

### 3. CORS Configuration
✅ Backend automatically allows:
- `http://localhost:5173` (local dev)
- `http://localhost:5174` (local dev alternate)
- `https://geniepay.nischay.tech` (production)

---

## 🌐 Frontend Deployment (Vercel/Netlify)

### 1. Build Settings
```
Root Directory: client
Build Command: npm run build
Output Directory: dist
```

### 2. Environment Variables
Add in deployment platform:

```env
VITE_API_URL=https://geniepay.onrender.com
```

### 3. For Vercel - Create `vercel.json`
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### 4. For Netlify - Create `client/public/_redirects`
```
/*    /index.html   200
```

---

## 🔄 Switching Between Local and Production

### Local Development
**No changes needed!** Just run:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd client
npm run dev
```

The frontend automatically uses `http://localhost:5000` from `.env`

### Deploy to Production
1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Backend (Render):**
   - Auto-deploys from GitHub
   - Uses production environment variables

3. **Frontend (Vercel/Netlify):**
   - Auto-deploys from GitHub
   - Uses `.env.production` → connects to `https://geniepay.onrender.com`

---

## ✅ Verification Checklist

### Backend Health Check
Visit: https://geniepay.onrender.com
Should see:
```json
{
  "message": "🌩️ GeniePay API - AI + Blockchain Subscription System",
  "version": "1.0.0"
}
```

### Frontend Check
Visit: https://geniepay.nischay.tech
- Should load without CORS errors
- Login/Signup should work
- API calls should succeed

### Local Check
Visit: http://localhost:5173
- Should connect to local backend on port 5000
- Full functionality available

---

## 🐛 Troubleshooting

### CORS Errors
✅ **Already Fixed!** Backend allows:
- All localhost ports (5173, 5174)
- Production domain (geniepay.nischay.tech)

### Backend Not Responding
1. Check Render logs
2. Verify MongoDB connection string
3. Check environment variables are set

### Frontend API Calls Failing
1. Check `.env.production` has correct backend URL
2. Verify backend is running (visit backend URL)
3. Check browser console for errors

---

## 🔐 Security Notes

1. **Never commit** `.env` or `.env.production` files
2. **Change JWT_SECRET** in production (use long random string)
3. **Use HTTPS** for all production URLs
4. **Rotate secrets** regularly

---

## 📝 Quick Commands

```bash
# Local Development
cd backend && npm run dev
cd client && npm run dev

# Build Frontend for Production
cd client && npm run build

# Test Production Build Locally
cd client && npm run preview

# Deploy (if using Git)
git push origin main  # Auto-deploys to Render & Vercel/Netlify
```

---

## 🎉 You're All Set!

The project now works seamlessly in both:
- ✅ Local development (localhost)
- ✅ Production deployment (deployed URLs)

No manual switching needed! 🚀
