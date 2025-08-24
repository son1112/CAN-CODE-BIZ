# Vercel Branch Configuration Guide

## Current Issue
The `rubber-ducky-live-alpha` (staging) project is deploying from `main` branch instead of `develop` branch, causing deployment failures because fixes are on `develop` but not yet on `main`.

## Required Configuration

### Production Branch Settings (Vercel Dashboard)

#### 1. rubber-ducky-live (Production)
- **Project**: `rubber-ducky-live`
- **Production Branch**: `main` ✅ (already correct)
- **Purpose**: Production deployments
- **URL**: https://rubber-ducky-live.vercel.app

#### 2. rubber-ducky-live-alpha (Staging) 
- **Project**: `rubber-ducky-live-alpha`
- **Production Branch**: `develop` ❌ (needs to be changed from `main`)
- **Purpose**: Staging deployments from develop branch
- **URL**: https://rubber-ducky-live-alpha-can-code-alpha-projects.vercel.app

#### 3. rubber-ducky-live-test (Testing)
- **Project**: `rubber-ducky-live-test`
- **Production Branch**: flexible (any branch for testing)
- **Purpose**: Feature branch testing
- **URL**: https://rubber-ducky-live-test-can-code-alpha-projects.vercel.app

## How to Fix

### Via Vercel Dashboard
1. **Navigate to Project**: https://vercel.com/can-code-alpha-projects/rubber-ducky-live-alpha
2. **Go to Settings** → **Environments**
3. **Click on "Production"** (currently shows `main:rubber-ducky-live-alpha`)
4. **Change branch from**: `main` to `develop`
5. **Save changes**

### Expected Result
After changing the production branch:
- Pushes to `develop` will trigger production deployments to staging
- The staging environment will use the latest `develop` code
- TypeScript fixes on `develop` will be deployed to staging
- `main` branch remains separate for production

## Verification Steps

### 1. Check Current Branch Configuration
You can verify current settings in Vercel dashboard:
- Project Settings → Git → Production Branch

### 2. Test Deployment
After changing configuration:
1. Push a test commit to `develop`
2. Check that `rubber-ducky-live-alpha` deploys automatically
3. Verify no deployment is triggered for `rubber-ducky-live` (production)

### 3. Monitor GitHub Checks
GitHub status checks should show:
- ✅ **Vercel - rubber-ducky-live-alpha** (from develop branch)
- No deployment for **Vercel - rubber-ducky-live** (until pushed to main)

## Workflow After Fix

### Development Flow
```
feature-branch → develop → main
     ↓             ↓        ↓
[manual test]  [staging]  [production]
     ↓             ↓        ↓
  test env    alpha env   live env
```

### Branch Responsibilities
- **develop**: Integration branch, auto-deploys to staging
- **main**: Production-ready code, auto-deploys to production
- **feature branches**: Can be manually deployed to test environment

## Troubleshooting

### If Staging Still Deploys from Main
- Verify the Production Branch setting was saved
- Check that the Git connection is correct
- Try triggering a manual deployment from develop

### If Production Accidentally Deploys
- Check that `rubber-ducky-live` is still set to `main` branch
- Use Vercel rollback if needed
- Verify branch protection rules in GitHub

## Benefits of This Configuration

✅ **Safe Development**: Staging tests develop branch before production
✅ **Proper Separation**: Each environment has its own branch
✅ **Automatic Deployments**: Push to develop = staging deployment
✅ **Production Safety**: Main branch remains stable
✅ **Easy Rollback**: Each environment can rollback independently

This configuration ensures the deployment pipeline works as intended:
`develop` (with fixes) → staging environment → testing → `main` → production