# 🚀 Rubber Ducky Live - Production Deployment Guide

## Overview
This guide walks through deploying Rubber Ducky Live to production using our recommended 3-phase deployment strategy.

## 📋 Prerequisites

### Required Accounts & Services
1. **GitHub Account** (already have - repository is ready)
2. **Vercel Account** (Sign up at [vercel.com](https://vercel.com))
3. **MongoDB Atlas Account** (Database hosting)
4. **Google Cloud Console** (OAuth & Drive integration)
5. **Anthropic API Access** (Claude AI integration)
6. **AssemblyAI Account** (Speech recognition)

### Required Environment Variables
Copy the values from your `.env.local` to set up production:

```bash
# Database
MONGODB_URI=mongodb+srv://...
MONGODB_DB=rubber-ducky-production

# AI Services  
ANTHROPIC_API_KEY=sk-ant-api03-...
ASSEMBLYAI_API_KEY=...

# Authentication
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=... (generate new for production)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Public Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_DEMO_MODE=false
```

---

## 🎯 Phase 1: Immediate Vercel Deployment (2-4 hours)

### Step 1: Vercel Account Setup
```bash
# Login to Vercel CLI
npx vercel login
# Follow the browser authentication flow
```

### Step 2: Import GitHub Repository
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import from GitHub: `son1112/rubber-ducky-live`
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (leave default)

### Step 3: Environment Variables Setup
In Vercel project settings → Environment Variables:

```bash
# Add each variable for "Production" environment
MONGODB_URI=mongodb+srv://...
MONGODB_DB=rubber-ducky-production
ANTHROPIC_API_KEY=sk-ant-api03-...
ASSEMBLYAI_API_KEY=...
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=... (generate new!)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_DEMO_MODE=false
```

### Step 4: Deploy
```bash
# From project root
npx vercel --prod
# Or trigger deployment from Vercel dashboard
```

### Step 5: Verify Deployment
- Check health endpoint: `https://your-app.vercel.app/healthz`
- Test authentication flow
- Verify database connectivity
- Test core chat functionality

**Expected Monthly Cost: $20-50**

---

## 🔄 Phase 2: Railway Migration (Month 2) - 40-60% Cost Savings

### Why Railway?
- **Cost Savings**: $8-25/month vs $20-50/month on Vercel
- **Usage-Based Pricing**: Pay only for active compute time
- **Built-in MongoDB**: No need for external database hosting
- **Scale-to-Zero**: Staging environments cost $0 when not in use

### Migration Steps
1. **Railway Account Setup**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   railway login
   ```

2. **Create Railway Project**
   ```bash
   railway new rubber-ducky-live
   cd rubber-ducky-live
   railway link
   ```

3. **Environment Configuration**
   ```bash
   # Set environment variables
   railway variables set ANTHROPIC_API_KEY=sk-ant-api03-...
   railway variables set ASSEMBLYAI_API_KEY=...
   # ... (add all variables)
   ```

4. **Deploy from GitHub**
   - Connect GitHub repository in Railway dashboard
   - Configure automatic deployments
   - Set up MongoDB service within Railway

5. **Domain Setup**
   - Configure custom domain or use Railway's provided domain
   - Update NEXTAUTH_URL and NEXT_PUBLIC_APP_URL

**Expected Monthly Cost: $8-25**

---

## 🏢 Phase 3: AWS Scaling (Month 6+) - Enterprise Ready

### When to Consider AWS
- Monthly hosting costs exceed $500 on other platforms
- Need enterprise compliance features
- Require advanced monitoring and analytics
- Need multi-region deployment

### AWS Setup (High-Level)
1. **AWS Amplify Hosting**
   - Static site hosting with serverless backend
   - Automatic scaling and CDN distribution

2. **Lambda Functions**
   - API routes as serverless functions
   - Cost-effective for variable traffic

3. **MongoDB Atlas Integration**
   - Cross-cloud database connectivity
   - Advanced security and monitoring

**Expected Monthly Cost: $25-100+ (scales with usage)**

---

## 🛠 Production Checklist

### Before Going Live
- [ ] **Security Review**
  - [ ] All environment variables use production values
  - [ ] No demo mode or test data in production
  - [ ] API keys are production-level (not test keys)
  - [ ] Database uses production cluster
  
- [ ] **Performance Optimization**
  - [ ] MongoDB indexes are optimized
  - [ ] Image assets are compressed
  - [ ] Bundle size is optimized
  
- [ ] **Monitoring Setup**
  - [ ] Health check endpoint is working (`/healthz`)
  - [ ] Error tracking is configured
  - [ ] Analytics are set up
  
- [ ] **Domain & SSL**
  - [ ] Custom domain is configured
  - [ ] SSL certificates are active
  - [ ] Redirects from www/non-www are working

### After Deployment
- [ ] **User Acceptance Testing**
  - [ ] Test all major features end-to-end
  - [ ] Verify file exports work correctly
  - [ ] Test voice recognition functionality
  - [ ] Confirm OAuth flows work properly
  
- [ ] **Performance Monitoring**
  - [ ] Monitor response times
  - [ ] Check database performance
  - [ ] Verify scaling behavior
  
- [ ] **Cost Monitoring**
  - [ ] Set up billing alerts
  - [ ] Monitor usage patterns
  - [ ] Plan for next phase if costs exceed thresholds

---

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check MongoDB Atlas IP whitelist
# Ensure 0.0.0.0/0 is allowed for Vercel
# Verify connection string format
```

#### Authentication Issues
```bash
# Verify NEXTAUTH_URL matches deployment URL
# Check Google OAuth allowed origins
# Ensure NEXTAUTH_SECRET is set and secure
```

#### API Timeouts
```bash
# Vercel functions timeout at 30s (configured in vercel.json)
# Check for slow database queries
# Verify external API response times
```

### Getting Help
- Check Vercel deployment logs
- Monitor application logs via Vercel dashboard
- Use health check endpoint to verify service status

---

## 📊 Cost Comparison Summary

| Platform | Setup Time | Monthly Cost | Best For |
|----------|------------|--------------|----------|
| **Vercel** | 2-4 hours | $20-50 | Immediate deployment |
| **Railway** | 4-8 hours | $8-25 | Cost optimization |
| **AWS** | 1-2 days | $25-100+ | Enterprise scale |

## 🎯 Recommended Timeline
- **Week 1**: Deploy to Vercel (immediate production)
- **Month 2**: Migrate to Railway (cost optimization) 
- **Month 6+**: Consider AWS (if scaling requirements justify complexity)

---

*Last Updated: August 22, 2025*
*Next Review: September 22, 2025*