# Essential Development Commands

## Development
- `npm run dev` - Start development server
- `npm run build` - Production build with cache busting
- `npm start` - Start production server

## Testing
- `npm test` - Run unit tests
- `npm run test:watch` - Watch mode testing
- `npm run test:coverage` - Test coverage report
- `npm run test:e2e` - End-to-end tests with Playwright
- `npm run test:critical` - Critical path cross-browser testing
- `npm run test:mobile` - Mobile device testing

## Code Quality
- `npm run lint` - ESLint checking
- `npm run preversion` - Pre-commit checks (lint + build)

## Cache Management (Next.js)
- `npm run clean:dev` - Clear .next cache and restart dev
- `npm run clean:cache` - Clear .next cache only
- `npm run clean:all` - Nuclear cache clear + reinstall

## Release Management
- `npm run version:patch` - Patch release (0.1.0 → 0.1.1)
- `npm run version:minor` - Minor release (0.1.0 → 0.2.0)
- `npm run version:major` - Major release (0.1.0 → 1.0.0)

## Branch Management
- Always work on `develop` branch
- Never push directly to `main` (auto-deploys to production)
- Use `git checkout develop` at session start