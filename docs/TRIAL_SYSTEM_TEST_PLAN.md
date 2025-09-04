# Trial System Test Coverage Plan

## 🎯 Test Coverage Goals
- **Target Coverage**: 80% for all trial-related code
- **Priority**: Core business logic > API endpoints > UI components > Edge cases
- **Test Types**: Unit tests for logic, Integration tests for APIs, Component tests for UI

## 📊 Current Coverage Gaps (Critical)

### 1. Models & Data Layer (0% Coverage)
- **UserTier.ts** (325 lines, 0% coverage)
  - Virtual fields (isTrialActive, trialDaysRemaining, hasTrialExpired)
  - Instance methods (extendTrial, trackFeatureUsage, upgradeToTier)
  - Static methods (createTrialUser, findExpiringTrials)
  - Pre-save middleware

### 2. Business Logic Layer (0% Coverage)
- **lib/trial/trialManager.ts** (300+ lines, 0% coverage)
  - TrialManager class methods
  - Feature access control logic
  - Usage limit checking
  - Conversion metrics calculation

### 3. API Endpoints (0% Coverage)
- **app/api/trial/status/route.ts** - GET/PATCH trial status
- **app/api/trial/start/route.ts** - POST start trial, GET eligibility
- **app/api/trial/extend/route.ts** - POST/GET trial extension
- **app/api/trial/track-usage/route.ts** - POST/GET usage tracking
- **app/api/trial/analytics/route.ts** - POST/GET/DELETE analytics

### 4. Context & State Management (0% Coverage)
- **contexts/TrialContext.tsx** (500+ lines, 0% coverage)
  - TrialProvider state management
  - Feature access checking
  - Usage tracking integration
  - Upgrade prompt logic

### 5. Custom Hooks (0% Coverage)
- **hooks/useTrialStatus.ts** (200+ lines, 0% coverage)
  - Trial status management
  - Countdown calculations
  - Feature-specific interactions
  - Conversion tracking

### 6. UI Components (0% Coverage)
- **TrialStatusBanner.tsx** - Status display and countdown
- **TrialShowcase.tsx** - Interactive feature demonstrations
- **OnboardingProgress.tsx** - Progress tracking and milestones
- **TrialWelcome.tsx** - Welcome modal and onboarding integration

## 🏗️ Test Implementation Plan

### Phase 1: Core Business Logic (Priority 1)
**Tests to implement immediately:**

#### UserTier Model Tests
```typescript
// tests/unit/models/UserTier.test.ts
describe('UserTier Model', () => {
  describe('Virtual Fields', () => {
    test('isTrialActive returns true for active trial')
    test('isTrialActive returns false for expired trial')
    test('trialDaysRemaining calculates correctly')
    test('hasTrialExpired detects expiration')
    test('canExtendTrial respects extension limits')
  })

  describe('Instance Methods', () => {
    test('extendTrial adds days correctly')
    test('extendTrial respects max extensions')
    test('trackFeatureUsage adds to arrays')
    test('upgradeToTier changes tier and status')
    test('resetUsageCounters works monthly')
  })

  describe('Static Methods', () => {
    test('createTrialUser creates proper trial')
    test('findExpiringTrials finds correct users')
    test('getTrialAnalytics returns proper data')
  })
})
```

#### TrialManager Service Tests
```typescript
// tests/unit/lib/trial/trialManager.test.ts
describe('TrialManager', () => {
  describe('Trial Lifecycle', () => {
    test('initializeTrialUser creates new trial')
    test('getTrialStatus returns correct status')
    test('extendTrial works within limits')
    test('upgradeUser changes tier properly')
  })

  describe('Feature Access', () => {
    test('hasFeatureAccess respects tier limits')
    test('checkUsageLimit validates correctly')
    test('getFeatureLimit returns proper limits')
  })

  describe('Analytics & Metrics', () => {
    test('getConversionMetrics calculates correctly')
    test('getTrialProgress returns proper progress')
    test('trackFeatureUsage records properly')
  })
})
```

### Phase 2: API Integration Tests (Priority 2)
**Focus on critical trial endpoints:**

#### Trial Status API Tests
```typescript
// tests/integration/api/trial/status.test.ts
describe('/api/trial/status', () => {
  describe('GET', () => {
    test('returns trial status for authenticated user')
    test('creates trial for new user')
    test('returns 401 for unauthenticated')
    test('handles database errors gracefully')
  })

  describe('PATCH', () => {
    test('updates trial status correctly')
    test('handles tier upgrades')
    test('validates admin permissions')
  })
})
```

#### Trial Management API Tests
```typescript
// tests/integration/api/trial/start.test.ts
// tests/integration/api/trial/extend.test.ts  
// tests/integration/api/trial/track-usage.test.ts
// tests/integration/api/trial/analytics.test.ts
```

### Phase 3: Context & Hook Tests (Priority 3)

#### TrialContext Tests
```typescript
// tests/unit/contexts/TrialContext.test.tsx
describe('TrialContext', () => {
  test('provides trial status correctly')
  test('tracks feature usage')
  test('handles upgrade prompts')
  test('manages feature access')
})
```

#### useTrialStatus Hook Tests
```typescript
// tests/unit/hooks/useTrialStatus.test.ts
describe('useTrialStatus', () => {
  test('calculates trial day correctly')
  test('tracks session analytics')
  test('manages countdown state')
})
```

### Phase 4: Component Tests (Priority 4)

#### Trial UI Component Tests
```typescript
// tests/unit/components/TrialStatusBanner.test.tsx
// tests/unit/components/TrialShowcase.test.tsx
// tests/unit/components/OnboardingProgress.test.tsx
// tests/unit/components/TrialWelcome.test.tsx
```

## 🧪 Test Utilities & Mocks

### Trial Test Factory
```typescript
// tests/factories/trialFactory.ts
export const createMockTrialUser = (overrides = {}) => ({
  userId: 'test-user',
  tier: 'trial',
  trialStartDate: new Date(),
  trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  trialExtensions: 0,
  maxTrialExtensions: 2,
  ...overrides
})

export const createMockTrialStatus = (overrides = {}) => ({
  isTrialActive: true,
  trialDaysRemaining: 7,
  trialExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  hasTrialExpired: false,
  canExtendTrial: true,
  tier: 'trial',
  ...overrides
})
```

### API Test Helpers
```typescript
// tests/helpers/trialHelpers.ts
export const mockAuthenticatedUser = (userId = 'test-user') => {
  // Mock authentication
}

export const setupTrialDatabase = async () => {
  // Database setup for trial tests
}

export const cleanupTrialData = async () => {
  // Cleanup after trial tests
}
```

## 📋 Test Coverage Targets by File

| File | Current | Target | Priority |
|------|---------|---------|----------|
| UserTier.ts | 0% | 90% | 🔴 Critical |
| trialManager.ts | 0% | 85% | 🔴 Critical |
| TrialContext.tsx | 0% | 80% | 🟡 High |
| useTrialStatus.ts | 0% | 80% | 🟡 High |
| Trial API routes | 0% | 85% | 🟡 High |
| TrialStatusBanner.tsx | 0% | 70% | 🟢 Medium |
| TrialShowcase.tsx | 0% | 70% | 🟢 Medium |
| OnboardingProgress.tsx | 0% | 70% | 🟢 Medium |
| TrialWelcome.tsx | 0% | 65% | 🟢 Medium |

## 🚀 Implementation Timeline

### Week 1: Foundation Tests
- [ ] UserTier model tests (90% coverage)
- [ ] TrialManager service tests (85% coverage)
- [ ] Basic API endpoint tests (status, start)

### Week 2: Integration & Context
- [ ] Remaining API endpoint tests
- [ ] TrialContext provider tests
- [ ] useTrialStatus hook tests

### Week 3: Component & E2E
- [ ] Core component tests
- [ ] Integration test scenarios  
- [ ] Edge case coverage

### Week 4: Optimization & Documentation
- [ ] Performance test scenarios
- [ ] Error handling edge cases
- [ ] Test documentation updates

## 🎯 Success Metrics

**Coverage Goals:**
- Overall trial system coverage: 80%+
- Critical business logic: 90%+
- API endpoints: 85%+
- React components: 70%+

**Quality Metrics:**
- All tests pass consistently
- No test flakiness or race conditions
- Clear, maintainable test code
- Good separation between unit/integration tests

## 🛡️ Risk Mitigation

**High-Risk Areas:**
1. **Date/time calculations** - Trial expiration logic
2. **Async operations** - API calls and database operations
3. **State management** - Context provider edge cases
4. **Feature gating** - Access control logic

**Test Strategies:**
- **Mock timers** for date-dependent tests
- **Database transactions** for isolated integration tests
- **React Testing Library** for user-focused component tests
- **Comprehensive error scenarios** for all failure modes