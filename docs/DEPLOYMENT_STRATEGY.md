# Deployment Strategy - Staging vs Production

## Overview

This document outlines the recommended deployment strategy for Rubber Ducky Live to provide proper separation between staging and production environments.

## Current State Analysis

### Current Vercel Projects
- **`rubber-ducky-live`** (Main Production)
  - URL: https://rubber-ducky-live.vercel.app
  - Production Branch: `main`
  - Preview Branches: feature branches (not `develop`)

- **`rubber-ducky-live-alpha`** (Staging - **ACTIVE**)
  - URL: https://rubber-ducky-live-alpha-can-code-alpha-projects.vercel.app
  - **Currently linked to `develop` branch**
  - Automatic deployments on push to `develop`

- **`rubber-ducky-live-test`** (Available for testing)
  - URL: https://rubber-ducky-live-test-can-code-alpha-projects.vercel.app
  - Available for experimental/testing branches

### Current Deployment Behavior ✅ **RESOLVED**
- ✅ `main` → Production deployment (rubber-ducky-live)
- ✅ `develop` → Staging deployment (rubber-ducky-live-alpha) **ACTIVE**
- ⚠️ Feature branches → Could create dedicated test branch deployments (future consideration)

## Recommended Strategy

### Option 1: Separate Projects Approach (RECOMMENDED)

#### Environment Separation
- **Production**: `rubber-ducky-live` project
  - Domain: https://rubber-ducky-live.vercel.app
  - Git Branch: `main` only
  - Environment: Production MongoDB, production API keys
  - Stability: High - only tested, approved code

- **Staging**: `rubber-ducky-live-alpha` project
  - Domain: https://rubber-ducky-live-alpha-can-code-alpha-projects.vercel.app
  - Git Branch: `develop` (and optionally feature branches)
  - Environment: Staging MongoDB, separate API keys
  - Purpose: Pre-production testing, QA validation

- **Development/Testing**: `rubber-ducky-live-test` project
  - Domain: https://rubber-ducky-live-test-can-code-alpha-projects.vercel.app
  - Git Branch: Feature branches, experimental code
  - Environment: Test MongoDB, demo API keys
  - Purpose: Development testing, experimental features

#### Benefits
- ✅ Complete isolation between environments
- ✅ Different environment variables per environment
- ✅ No risk of staging affecting production
- ✅ Clear separation of concerns
- ✅ Flexible MongoDB database per environment

#### Implementation Steps
1. Configure `rubber-ducky-live` (Production)
   - Set production branch to `main` only
   - Configure production environment variables
   - Disable preview deployments from other branches

2. Configure `rubber-ducky-live-alpha` (Staging)
   - Set production branch to `develop`
   - Configure staging environment variables
   - Connect to staging MongoDB database

3. Configure `rubber-ducky-live-test` (Development)
   - Enable all feature branch deployments
   - Configure development environment variables
   - Connect to test MongoDB database

### Option 2: Branch-Based Deployment (Alternative)

Keep single project but configure strict branch rules:
- `main` → Production deployment only
- `develop` → Preview deployment (staging environment variables)
- Feature branches → Preview deployment (development environment variables)

#### Benefits
- ✅ Simpler project management
- ✅ Single dashboard for all deployments

#### Drawbacks
- ⚠️ Risk of configuration conflicts
- ⚠️ Shared environment variables complexity
- ⚠️ Less isolation between environments

## Environment Variables Strategy

### Production Environment (`rubber-ducky-live`)
```
MONGODB_URI=mongodb+srv://...@cluster/rubber-ducky-live-production
MONGODB_DB=rubber-ducky-live-production
NEXT_PUBLIC_APP_URL=https://rubber-ducky-live.vercel.app
NEXT_PUBLIC_DEMO_MODE=false
NODE_ENV=production
```

### Staging Environment (`rubber-ducky-live-alpha`)
```
MONGODB_URI=mongodb+srv://...@cluster/rubber-ducky-live-staging
MONGODB_DB=rubber-ducky-live-staging
NEXT_PUBLIC_APP_URL=https://rubber-ducky-live-alpha-can-code-alpha-projects.vercel.app
NEXT_PUBLIC_DEMO_MODE=false
NODE_ENV=production
```

### Development Environment (`rubber-ducky-live-test`)
```
MONGODB_URI=mongodb+srv://...@cluster/rubber-ducky-live-development
MONGODB_DB=rubber-ducky-live-development
NEXT_PUBLIC_APP_URL=https://rubber-ducky-live-test-can-code-alpha-projects.vercel.app
NEXT_PUBLIC_DEMO_MODE=true
NODE_ENV=development
```

## Deployment Workflow

### Recommended Git Flow
```
feature-branch → develop → main
     ↓             ↓        ↓
  [Testing]    [Staging]  [Production]
```

1. **Development**: Feature branches deployed to test environment
2. **Integration**: Merge to `develop` → Deploy to staging
3. **Production**: Merge `develop` to `main` → Deploy to production

### Manual Deployment Commands

```bash
# Deploy specific branch to specific project
vercel --prod --yes --scope can-code-alpha-projects --project-name rubber-ducky-live  # Production
vercel --prod --yes --scope can-code-alpha-projects --project-name rubber-ducky-live-alpha  # Staging
vercel --prod --yes --scope can-code-alpha-projects --project-name rubber-ducky-live-test   # Development
```

## MongoDB Database Strategy

### Database Separation
- **Production**: `rubber-ducky-live-production`
- **Staging**: `rubber-ducky-live-staging` 
- **Development**: `rubber-ducky-live-development`

### Data Management
- Production: Real user data, high availability
- Staging: Copy of production data for testing (periodic refresh)
- Development: Test data, reset regularly

## Monitoring and Alerting

### Health Checks
- Production: Critical alerts, 24/7 monitoring
- Staging: Warning alerts, business hours monitoring  
- Development: Info logging, manual checks

### API Endpoints
- `/api/health` - Environment-specific health checks
- `/api/debug-db` - Database connection status
- `/api/debug-auth` - Authentication configuration

## Security Considerations

- **API Keys**: Separate keys per environment
- **Database Access**: Restricted by environment
- **Authentication**: Production uses real OAuth, staging uses test accounts
- **Secrets**: Environment-specific secrets rotation

## Implementation Priority

### Phase 1: Critical Setup ✅ **COMPLETED**
1. ✅ Configure production project to only deploy from `main`
2. ✅ Set up staging project for `develop` branch (**Currently Active**)
3. ✅ Configure environment-specific variables
4. ✅ Test deployment pipeline

### Phase 1.5: Future Consideration (Optional)
**Note**: The `develop` branch is currently working well with the staging environment. We may revisit creating dedicated testing branches later if needed, but the current setup provides good separation between staging and production.

### Phase 2: Enhancement (Next Sprint)
1. Set up separate MongoDB databases
2. Configure monitoring and alerting
3. Implement automated testing pipeline
4. Document deployment procedures

### Phase 3: Optimization (Future)
1. Custom domain for staging
2. Automated staging data refresh
3. Integration testing automation
4. Performance monitoring per environment

## Success Metrics

- ✅ Zero production incidents from staging deployments
- ✅ Faster feature validation cycle
- ✅ Clear separation of environment data
- ✅ Reduced deployment anxiety
- ✅ Improved testing confidence

## Rollback Strategy

- **Production**: Instant rollback via Vercel dashboard
- **Staging**: Git revert and redeploy
- **Development**: Reset to last known good state

This strategy ensures safe, reliable deployments while maintaining development velocity and production stability.