# 🏠 Local Development Guide

## ✅ **Current Status: READY**

Your local development environment is now set up and working correctly!

- **Frontend**: http://localhost:5173 ✅
- **Backend**: http://localhost:3001 ✅
- **CORS**: Working correctly ✅
- **Database**: SQLite (local only) ✅

## 🚀 **How to Test Changes Locally**

### 1. **Start Local Development**
```bash
# Terminal 1: Start Backend
cd backend
NODE_ENV=development FRONTEND_URL=http://localhost:5173 npm start

# Terminal 2: Start Frontend  
cd frontend
npm run dev
```

### 2. **Test Your Changes**
- Make changes to your code
- Frontend will auto-reload at http://localhost:5173
- Backend will auto-reload (if using nodemon) at http://localhost:3001
- Test all functionality locally before pushing to production

### 3. **Verify Everything Works**
```bash
# Run the test script
node test-local-setup.js
```

## 🔧 **Key Differences: Local vs Production**

| Feature | Local | Production |
|---------|-------|------------|
| **Database** | SQLite (./database/otrbaseball.db) | PostgreSQL (Render) |
| **Frontend URL** | http://localhost:5173 | https://otr-data.com |
| **Backend URL** | http://localhost:3001 | https://otr2025.onrender.com |
| **Email Service** | Disabled (no credentials) | Enabled (Gmail) |
| **Environment** | development | production |

## 🛡️ **Safety Features**

### **Local Environment Variables**
- `NODE_ENV=development` - Prevents production mode
- `FRONTEND_URL=http://localhost:5173` - Local frontend URL
- `JWT_SECRET=local-dev-secret` - Local JWT signing

### **Database Isolation**
- Local SQLite database is completely separate from production
- No risk of affecting production data
- Can reset/clear local database anytime

### **Email Service**
- Disabled locally (no credentials set)
- Prevents accidental emails during testing
- All email functions will log warnings instead of sending

## 🧪 **Testing Workflow**

### **1. Make Changes Locally**
```bash
# Edit your code
# Test functionality
# Verify everything works
```

### **2. Test Email Functionality**
```bash
# Check backend logs for email warnings
# Email functions will log: "⚠️ Email service not available"
# This is expected and safe for local testing
```

### **3. Test Database Operations**
```bash
# All database operations are local only
# Can create/delete users, players, sessions safely
# No impact on production data
```

### **4. Test CORS and Authentication**
```bash
# CORS is configured for localhost:5173
# JWT tokens work locally
# All auth flows can be tested safely
```

## 🚨 **Important Notes**

### **Never Push Local Environment Files**
- `.env.local` should never be committed
- Contains local-only settings
- Production uses Render environment variables

### **Database Reset (if needed)**
```bash
cd backend
rm database/otrbaseball.db
npm start  # Will recreate database
```

### **Port Conflicts**
```bash
# If port 3001 is in use:
lsof -ti:3001 | xargs kill -9

# If port 5173 is in use:
lsof -ti:5173 | xargs kill -9
```

## 🎯 **Testing Specific Features**

### **Player Invitations**
1. Create a player locally
2. Check backend logs for invitation email warnings
3. Verify invitation token generation works
4. Test invitation completion flow

### **File Uploads**
1. Upload CSV files locally
2. Check local `uploads/` directory
3. Verify parsing and database insertion
4. Test report generation

### **Analytics**
1. Create test sessions locally
2. Generate analytics reports
3. Test all visualization features
4. Verify data aggregation

## 🔄 **Deployment Process**

### **When Ready for Production**
1. **Test locally first** - Ensure everything works
2. **Commit changes** - `git add . && git commit -m "description"`
3. **Push to main** - `git push origin main`
4. **Monitor deployment** - Check Render logs
5. **Test production** - Verify changes work on live site

### **Rollback if Needed**
```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

## 📞 **Troubleshooting**

### **Backend Won't Start**
```bash
# Check if port is in use
lsof -i :3001

# Kill existing processes
pkill -f "node.*app.js"

# Check database permissions
chmod 644 backend/database/otrbaseball.db
```

### **Frontend Won't Start**
```bash
# Check if port is in use
lsof -i :5173

# Kill existing processes
pkill -f "vite"

# Clear node modules (if needed)
cd frontend && rm -rf node_modules && npm install
```

### **CORS Errors**
- Ensure `FRONTEND_URL=http://localhost:5173` is set
- Check that frontend is running on port 5173
- Verify backend CORS configuration

---

## 🎉 **You're All Set!**

Your local development environment is now completely isolated from production. You can:

- ✅ Test all features safely
- ✅ Make changes without affecting live site
- ✅ Debug issues locally
- ✅ Experiment with new features
- ✅ Reset data anytime

**Happy coding! 🚀** 