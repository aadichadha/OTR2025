# Deployment Guide: Player Progression & 20-80 Grading System

## 🚀 Deployment Overview

This guide covers deploying the new Player Progression features and 20-80 Grading System to production.

### New Features Being Deployed:
- ✅ 20-80 Baseball Scouting Grade System
- ✅ Enhanced Progression API (`/api/players/:playerId/progression`)
- ✅ Advanced Progression Page with 4 tabs
- ✅ Micro-features (sparklines, milestones, coaching tips)
- ✅ Reusable components and hooks

## 📋 Pre-Deployment Checklist

### Backend Changes:
- [x] `backend/src/utils/grade20to80.js` - New grading utility
- [x] `backend/src/controllers/analyticsController.js` - Enhanced with progression endpoint
- [x] `backend/src/app.js` - New route added
- [x] No database migrations required (uses existing schema)

### Frontend Changes:
- [x] `frontend/src/utils/grade20to80.js` - Frontend grading utilities
- [x] `frontend/src/pages/PlayerProgression.jsx` - New progression page
- [x] `frontend/src/hooks/useProgressionData.js` - Custom hooks
- [x] `frontend/src/components/ProgressionLink.jsx` - Navigation component
- [x] `frontend/src/App.jsx` - New route added

## 🔧 Deployment Steps

### Step 1: Backend Deployment (Render)

The backend will automatically deploy when you push to your main branch. Render will:
1. Install dependencies
2. Run the postinstall script (migrations)
3. Start the application

**Manual deployment trigger:**
```bash
# If you need to trigger a manual deployment
git add .
git commit -m "feat: Add Player Progression & 20-80 Grading System"
git push origin main
```

### Step 2: Frontend Deployment (Vercel)

The frontend will automatically deploy when you push to your main branch. Vercel will:
1. Install dependencies with legacy peer deps
2. Build the application
3. Deploy to production

**Manual deployment trigger:**
```bash
# If you need to trigger a manual deployment
git add .
git commit -m "feat: Add Player Progression & 20-80 Grading System"
git push origin main
```

### Step 3: Verify Deployment

#### Backend Health Check:
```bash
curl https://otr2025.onrender.com/api/health
```

#### Test New Progression Endpoint:
```bash
# Replace {playerId} with an actual player ID
curl https://otr2025.onrender.com/api/players/{playerId}/progression
```

#### Frontend Verification:
1. Visit: https://otr-data.com
2. Navigate to a player's progression page
3. Test all four tabs (Overview, Trends, Goals, Swing Analysis)

## 🧪 Testing Checklist

### Backend API Tests:
- [ ] Health endpoint responds
- [ ] Progression endpoint returns data
- [ ] 20-80 grade calculations work correctly
- [ ] Error handling for invalid player IDs
- [ ] CORS headers are set correctly

### Frontend Tests:
- [ ] Progression page loads without errors
- [ ] All four tabs function correctly
- [ ] Charts and visualizations render
- [ ] Grade indicators display properly
- [ ] Navigation between tabs works
- [ ] Responsive design on mobile devices

### Integration Tests:
- [ ] Data flows correctly from backend to frontend
- [ ] Grade calculations match between frontend and backend
- [ ] Error states are handled gracefully
- [ ] Loading states display correctly

## 🔍 Post-Deployment Verification

### 1. Check Render Dashboard:
- Visit: https://dashboard.render.com
- Verify backend service is running
- Check logs for any errors
- Monitor resource usage

### 2. Check Vercel Dashboard:
- Visit: https://vercel.com/dashboard
- Verify frontend deployment is successful
- Check build logs for any warnings
- Monitor performance metrics

### 3. Test User Flows:
- [ ] Coach can view player progression
- [ ] Player can view their own progression
- [ ] Grade calculations are accurate
- [ ] Milestones are detected correctly
- [ ] Coaching tips are generated

## 🚨 Troubleshooting

### Common Issues:

#### Backend Issues:
1. **Database Connection Errors**
   - Check DATABASE_URL environment variable
   - Verify database is accessible
   - Check migration status

2. **API Endpoint Not Found**
   - Verify route is properly registered in app.js
   - Check authentication middleware
   - Review CORS configuration

3. **Grade Calculation Errors**
   - Verify levelStats are being calculated
   - Check benchmark data availability
   - Review error handling in grade20to80.js

#### Frontend Issues:
1. **Build Failures**
   - Check for missing dependencies
   - Verify import statements
   - Review TypeScript/ESLint errors

2. **Runtime Errors**
   - Check browser console for errors
   - Verify API calls are working
   - Review React component errors

3. **Visual Issues**
   - Check Material-UI theme compatibility
   - Verify chart library imports
   - Review responsive design

### Debug Commands:

#### Backend Debugging:
```bash
# Check backend logs
curl https://otr2025.onrender.com/api/health

# Test progression endpoint
curl -H "Authorization: Bearer {token}" \
  https://otr2025.onrender.com/api/players/{playerId}/progression
```

#### Frontend Debugging:
```bash
# Check build status
npm run build

# Test locally
npm run dev

# Check for linting issues
npm run lint
```

## 📊 Monitoring

### Key Metrics to Monitor:
- **API Response Times**: Progression endpoint performance
- **Error Rates**: 4xx and 5xx errors
- **User Engagement**: Progression page usage
- **Grade Calculation Accuracy**: Data validation

### Alerts to Set Up:
- Backend service down
- High error rates on progression endpoint
- Frontend build failures
- Database connection issues

## 🔄 Rollback Plan

If issues arise, you can rollback by:

### Backend Rollback:
1. Revert to previous commit
2. Push to trigger new deployment
3. Monitor for stability

### Frontend Rollback:
1. Revert to previous commit
2. Push to trigger new deployment
3. Clear browser cache

### Database Rollback:
- No schema changes were made, so no database rollback needed

## ✅ Success Criteria

Deployment is successful when:
- [ ] All endpoints respond correctly
- [ ] Progression page loads without errors
- [ ] Grade calculations are accurate
- [ ] Visualizations render properly
- [ ] No console errors in browser
- [ ] Mobile responsiveness works
- [ ] Performance is acceptable (< 3s load time)

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review application logs
3. Test with different browsers/devices
4. Verify data integrity

---

**Deployment Status**: ✅ Ready for Production
**Risk Level**: 🟢 Low (no database schema changes)
**Estimated Downtime**: 0 minutes (zero-downtime deployment) 