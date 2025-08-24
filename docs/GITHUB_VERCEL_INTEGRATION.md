# GitHub-Vercel Integration Guide

## Overview
This guide explains how to use the GitHub-Vercel integration for monitoring and debugging deployments directly from the GitHub interface.

## Reading Deployment Status

### In Commit History
Look for these status indicators next to each commit:

- ✅ **Green checkmark**: Deployment successful
- ❌ **Red X**: Deployment failed  
- 🟡 **Yellow circle**: Deployment in progress
- ⏸️ **Gray circle**: Deployment pending

### Status Check Names
- **Vercel - rubber-ducky-live**: Production environment
- **Vercel - rubber-ducky-live-alpha**: Staging environment
- **Vercel - rubber-ducky-live-test**: Test environment
- **Vercel Preview Comments**: PR comment integration

## Debugging Failed Deployments

### Step 1: Identify the Failure
1. Navigate to the commit with ❌ red status
2. Look at the "Some checks were not successful" section
3. Identify which environment(s) failed

### Step 2: Access Deployment Logs
1. Click **"Details"** next to the failed check
2. GitHub redirects to Vercel dashboard
3. View build logs and error details

### Step 3: Common Error Types

#### TypeScript Compilation Errors
```
Type error: Expected 1 arguments, but got 0.
```
**Fix**: Update code to match TypeScript requirements

#### Missing Environment Variables
```
Error: Missing required environment variable
```
**Fix**: Add variable in Vercel dashboard → Project → Settings → Environment Variables

#### Build Timeouts
```
Error: Command "npm run build" timed out
```
**Fix**: Optimize build process or increase timeout in vercel.json

#### Package Installation Failures
```
npm ERR! peer dep missing
```
**Fix**: Update package.json dependencies

## Using Integration in Pull Requests

### PR Checks
- **Required checks**: Can block merges if deployments fail
- **Preview deployments**: Automatic staging URLs in PR comments
- **Status visibility**: Reviewers can see deployment health

### Best Practices
1. **Wait for checks**: Don't merge with failing deployments
2. **Review preview**: Test changes in preview deployment
3. **Check all environments**: Ensure staging and production both pass

## Branch Protection Setup

### Recommended Settings
Navigate to: **Settings → Branches → Branch protection rules**

#### For `main` branch (Production):
- ☑️ **Require status checks to pass before merging**
- ☑️ **Require branches to be up to date before merging**
- ☑️ **Require pull request reviews before merging**
- Select: **Vercel - rubber-ducky-live**

#### For `develop` branch (Staging):
- ☑️ **Require status checks to pass before merging**  
- ☑️ **Require branches to be up to date before merging**
- Select: **Vercel - rubber-ducky-live-alpha**

## Emergency Procedures

### Production Deployment Failed
1. **Don't panic** - Previous deployment still running
2. **Check Details** → Vercel dashboard
3. **Quick rollback**: Vercel dashboard → Previous deployment → "Promote to Production"
4. **Fix and redeploy** when ready

### All Environments Failing
- Usually indicates **code-level issue** (TypeScript, syntax)
- Check most recent code changes
- Run `npm run build` locally to reproduce
- Fix issue and push - deployments auto-retry

### Staging Only Failing
- Safe to experiment with fixes
- Won't affect production
- Good for testing deployment fixes

## Monitoring Deployment Health

### Daily Workflow
1. **Check commit status** before starting work
2. **Monitor PR checks** during review process  
3. **Verify deployment success** after merging

### Team Coordination
- **Status visibility**: Everyone can see deployment health
- **Shared debugging**: Details links work for all team members
- **Async communication**: Status shows in commit history

## Quick Reference Commands

### Local Testing Before Deploy
```bash
npm run build          # Test production build
npm run lint           # Check for linting issues
npm run test           # Run test suite
```

### Deployment Commands
```bash
npm run deploy:staging:dry    # Preview staging deployment
npm run deploy:production     # Deploy to production
```

### Troubleshooting
```bash
vercel logs [deployment-url]  # Get deployment logs
vercel inspect [deployment]   # Get deployment details
```

## Integration Benefits Summary

- ✅ **Immediate feedback** on deployment status
- ✅ **Direct debugging** links to Vercel dashboard  
- ✅ **Team visibility** of deployment health
- ✅ **Prevents bad deployments** via PR checks
- ✅ **Historical tracking** of deployment success/failure
- ✅ **Emergency rollback** capabilities

This integration makes deployment monitoring **effortless** and **reliable**!