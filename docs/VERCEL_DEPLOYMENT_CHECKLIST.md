# Vercel Deployment Checklist for Next.js 15

## Pre-Deployment TypeScript Validation

### Route Handler Patterns (Next.js 15)
- [ ] All route handlers use proper async params pattern: `{ params }: { params: Promise<{ id: string }> }`
- [ ] Route handler functions accept NextRequest as first parameter when needed
- [ ] Auth middleware called with request parameter: `requireAuth(req)` not `requireAuth()`
- [ ] Auth results properly checked with `if ('error' in authResult)` pattern
- [ ] Return types are compatible: `Promise<void | Response>` or `NextResponse<T>`

### Dependency Management
- [ ] Production dependencies in `dependencies` section of package.json:
  - tailwindcss
  - autoprefixer
  - postcss
  - typescript
  - eslint
  - eslint-config-next
  - @eslint/eslintrc
- [ ] Remove private packages that require authentication
- [ ] Run `npm ls` to check for missing peer dependencies

### Module Resolution
- [ ] Webpack aliases configured in next.config.js:
  ```javascript
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname),
  };
  ```
- [ ] TypeScript baseUrl and paths configured in tsconfig.json:
  ```json
  {
    "compilerOptions": {
      "baseUrl": ".",
      "paths": { "@/*": ["./*"] }
    }
  }
  ```

### Build Configuration
- [ ] ESLint configured to not block builds: `eslint: { ignoreDuringBuilds: true }`
- [ ] Environment variables set in Vercel dashboard
- [ ] Node.js version compatibility (18.x or later for Next.js 15)

## Common Error Patterns & Solutions

### 1. "Cannot find module 'X'" Errors
**Cause**: Build tools missing from production dependencies  
**Solution**: Move from devDependencies to dependencies

### 2. "Invalid export" Route Errors  
**Cause**: Incorrect TypeScript route handler patterns  
**Solution**: Update to Next.js 15 async params pattern

### 3. Module Resolution Failures
**Cause**: "@/" imports not resolving  
**Solution**: Configure webpack aliases and TypeScript paths

### 4. Auth Middleware Errors
**Cause**: Missing request parameter or incorrect destructuring  
**Solution**: Pass `req` parameter and check `'error' in authResult`

### 5. Build Timeout on Vercel Free Tier
**Cause**: Large dependency installs or complex builds  
**Solution**: Consider upgrading or optimizing dependencies

## Validation Commands

Run these locally before deploying:

```bash
# TypeScript validation
npx tsc --noEmit

# Build validation
npm run build

# Dependency check
npm ls --depth=0

# Route handler validation
grep -r "export async function" app/api/ --include="*.ts"
```

## Vercel-Specific Considerations

### Environment Variables
- [ ] All required env vars set in Vercel dashboard
- [ ] No sensitive data in build logs
- [ ] DATABASE_URL uses production MongoDB instance

### Performance
- [ ] Function timeout configured (default 10s, max 30s on free tier)
- [ ] Bundle size optimization for serverless limits
- [ ] Edge runtime considerations for API routes

### Domains & SSL
- [ ] Custom domain configured if needed
- [ ] SSL certificate auto-provisioned
- [ ] DNS records updated

## Monitoring & Debugging

### Build Logs
- Check "Functions" tab for runtime errors
- Monitor "Analytics" for performance issues
- Use Vercel CLI for local debugging: `vercel dev`

### Common Production Issues
- [ ] Database connection timeouts
- [ ] Missing environment variables
- [ ] CORS configuration for external APIs
- [ ] Memory limits on serverless functions

## Emergency Rollback

If deployment fails:
1. Revert last commit: `git revert HEAD`
2. Push revert: `git push`
3. Vercel auto-deploys previous working version
4. Debug issues locally with `vercel dev`

---

*Last updated: 2025-08-22*  
*Next.js Version: 15.4.6*  
*Vercel Platform: Serverless Functions*