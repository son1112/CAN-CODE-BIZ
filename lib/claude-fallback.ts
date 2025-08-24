import { ClaudeModel, MODEL_CONFIGS } from './models';
import { logger } from './logger';

export interface ModelFallbackConfig {
  models: ClaudeModel[];
  timeout: number; // milliseconds
  maxRetries: number;
}

export interface FallbackResult {
  model: ClaudeModel;
  attempt: number;
  fallbackReason?: 'overloaded' | 'timeout' | 'error' | 'rate_limit';
  originalModel: ClaudeModel;
}

// Default fallback configuration - ordered by performance tier with smart degradation
// Primary: Claude 4 Sonnet (best balance) -> Reliable 3.5 -> Fast 3 Haiku -> Premium 4.1 Opus (last resort)
export const DEFAULT_FALLBACK_CONFIG: ModelFallbackConfig = {
  models: [
    'claude-sonnet-4-20250514',    // Primary (latest, best balance of speed/quality)
    'claude-3-5-sonnet-20241022',  // Reliable fallback (proven performance)
    'claude-3-haiku-20240307',     // Fast fallback (low cost, fastest response)
    'claude-opus-4-1-20250805'     // Premium fallback (highest quality, most expensive)
  ],
  timeout: 45000, // 45 seconds - reasonable for most requests
  maxRetries: 4   // Increased to account for additional model tier
};

// Detect if error is overload/rate limit related
export function isOverloadError(error: any): boolean {
  if (!error) return false;

  const errorMessage = error.message?.toLowerCase() || '';
  const errorType = error.type?.toLowerCase() || '';

  return (
    errorType === 'overloaded_error' ||
    errorType === 'rate_limit_error' ||
    errorMessage.includes('overloaded') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests') ||
    error.status === 429 ||
    error.status === 503
  );
}

// Detect if error is timeout related
export function isTimeoutError(error: any): boolean {
  if (!error) return false;

  const errorMessage = error.message?.toLowerCase() || '';

  return (
    error.name === 'TimeoutError' ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('aborted') ||
    error.code === 'ETIMEDOUT'
  );
}

// Get next fallback model in the hierarchy
export function getNextFallbackModel(
  currentModel: ClaudeModel,
  config: ModelFallbackConfig = DEFAULT_FALLBACK_CONFIG
): ClaudeModel | null {
  const currentIndex = config.models.indexOf(currentModel);

  if (currentIndex === -1 || currentIndex >= config.models.length - 1) {
    return null; // No fallback available
  }

  return config.models[currentIndex + 1];
}

// Create timeout wrapper for async operations
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);
    })
  ]);
}

// Log fallback usage for monitoring
export function logModelFallback(result: FallbackResult): void {
  logger.warn('Model fallback triggered', {
    component: 'claude-fallback',
    originalModel: result.originalModel,
    fallbackModel: result.model,
    attempt: result.attempt,
    reason: result.fallbackReason
  });
}

// Get user-friendly fallback explanation
export function getFallbackExplanation(result: FallbackResult): string {
  const originalConfig = MODEL_CONFIGS[result.originalModel];
  const fallbackConfig = MODEL_CONFIGS[result.model];

  let reason = '';
  switch (result.fallbackReason) {
    case 'overloaded':
      reason = 'due to high API demand';
      break;
    case 'timeout':
      reason = 'due to slow response time';
      break;
    case 'rate_limit':
      reason = 'due to rate limiting';
      break;
    default:
      reason = 'due to an error';
  }

  return `Switched from ${originalConfig.displayName} to ${fallbackConfig.displayName} ${reason}`;
}

// Check if model supports fallback (basic validation)
export function supportsModelFallback(model: ClaudeModel): boolean {
  return model in MODEL_CONFIGS;
}