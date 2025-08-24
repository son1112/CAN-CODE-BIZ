# Systematic Deployment Debugging Checklist

## Quick Reference: When Deployments Fail

### 🔍 **Step 1: Identify the Scope**
**GitHub Integration Check:**
- [ ] Check GitHub commit status for ❌ failed deployments
- [ ] Note which environments failed: Production, Staging, Test, or All
- [ ] Click "Details" to access Vercel dashboard logs

**Pattern Recognition:**
- [ ] **All 3 environments failing** → Usually code-level issue (TypeScript, syntax)
- [ ] **Production only failing** → Environment-specific config issue
- [ ] **Staging only failing** → Branch-specific or configuration mismatch
- [ ] **Test only failing** → Experimental code issues

### 🔧 **Step 2: Analyze Build Logs**
**Common Error Patterns to Look For:**

#### TypeScript Compilation Errors
```
Type error: Expected 1 arguments, but got 0.
./hooks/useMobileKeyboard.tsx:45:22
```
**Quick Fix:** Check TypeScript syntax, missing parameters, type definitions

#### Missing Environment Variables
```
Error: Missing required environment variable: MONGODB_URI
```
**Quick Fix:** Verify environment variables in Vercel dashboard

#### Build Timeouts
```
Error: Command "npm run build" timed out after 5m
```
**Quick Fix:** Check for infinite loops, large bundle sizes, or slow operations

#### Package Installation Failures
```
npm ERR! peer dep missing: react@^18.0.0
```
**Quick Fix:** Update package.json dependencies, clear node_modules

#### Branch Mismatch Issues
```
Cloning github.com/user/repo (Branch: main, Commit: abc123)
```
**Quick Fix:** Verify Vercel project is pulling from correct branch

### 🛠️ **Step 3: Branch Configuration Verification**

**Check Production Branch Settings:**
- [ ] **rubber-ducky-live** → Should use `main` branch
- [ ] **rubber-ducky-live-alpha** → Should use `develop` branch
- [ ] **rubber-ducky-live-test** → Flexible (any branch)

**Verify via Vercel Dashboard:**
1. [ ] Navigate to failing project
2. [ ] Settings → Git → Check "Production Branch"
3. [ ] Ensure it matches expected branch for that environment

### 🔄 **Step 4: Local Reproduction**
**Before Debugging Further:**
- [ ] `git checkout [failing-branch]`
- [ ] `npm install` (ensure deps are current)
- [ ] `npm run build` (reproduce the error locally)
- [ ] `npm run lint` (check for linting issues)
- [ ] `npm run test` (verify tests pass)

### 🚨 **Step 5: Emergency Procedures**

#### Production Down
- [ ] **Don't panic** - Previous deployment still running
- [ ] Access Vercel dashboard for affected project
- [ ] Click "View Function Logs" for runtime errors
- [ ] Use "Promote to Production" on previous successful deployment
- [ ] Monitor health endpoints after rollback

#### All Environments Failing
- [ ] Check most recent commits for obvious issues
- [ ] Look for TypeScript, syntax, or import errors
- [ ] Test build locally on current branch
- [ ] Consider reverting recent commits if critical

#### Staging Issues (Safe to Experiment)
- [ ] Staging failures won't affect production
- [ ] Good environment for testing fixes
- [ ] Can deploy multiple attempts quickly
- [ ] Use for validating deployment fixes

### 📊 **Step 6: Fix and Validate**

**Implementation:**
- [ ] Apply fix to appropriate branch
- [ ] Commit with descriptive message
- [ ] Push to trigger automatic redeployment

**Verification:**
- [ ] Monitor GitHub checks for ✅ green status
- [ ] Check Vercel dashboard for successful deployment
- [ ] Verify health endpoints respond correctly
- [ ] Test critical functionality in deployed environment

### 📝 **Step 7: Prevention and Documentation**

**Root Cause Analysis:**
- [ ] Document what caused the failure
- [ ] Update deployment documentation if needed
- [ ] Consider adding safeguards (tests, validation)
- [ ] Share learnings with team

**Process Improvements:**
- [ ] Add relevant tests to prevent recurrence
- [ ] Update CI/CD pipeline if needed
- [ ] Consider branch protection rules
- [ ] Update environment variable documentation

## Common Solutions Reference

### TypeScript Issues
```bash
# Check for TypeScript errors locally
npm run build
# Look for missing type definitions, incorrect imports
```

### Environment Variables
```bash
# List current variables per environment
vercel env list [environment]
# Add missing variables
vercel env add VARIABLE_NAME [environment]
```

### Branch Configuration
```
Vercel Dashboard → Project → Settings → Git → Production Branch
Change from "main" to "develop" for staging environments
```

### Package Issues
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Build Timeouts
```json
// vercel.json - Increase function timeout
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

## Success Criteria

✅ **All GitHub checks show green**
✅ **Vercel dashboard shows "Ready" status**
✅ **Health endpoints return 200 OK**
✅ **Critical user flows work correctly**
✅ **No console errors in browser dev tools**

## Contact and Escalation

- **Vercel Issues**: Check Vercel status page
- **GitHub Integration**: Verify webhook configuration
- **Environment Issues**: Review environment variable settings
- **Code Issues**: Run systematic debugging checklist above

This checklist provides a **systematic approach** to deployment debugging that reduces resolution time and prevents repeated issues.