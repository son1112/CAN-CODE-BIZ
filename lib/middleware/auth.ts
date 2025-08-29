/**
 * Authentication middleware for API routes
 * Provides consistent authentication handling across all endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { UnauthorizedError } from '@/lib/error-handler';

export interface AuthResult {
  userId: string;
  isDemo: boolean;
}

/**
 * Requires authentication for API endpoints
 * Returns user ID or throws UnauthorizedError
 */
export async function requireAuth(request?: NextRequest): Promise<AuthResult> {
  try {
    const session = await auth();
    const isDemoMode = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const userId = session?.user?.id;

    logger.debug('Authentication check', {
      component: 'auth-middleware',
      isDemoMode,
      hasSession: !!userId,
      path: request?.nextUrl?.pathname
    });

    // If we have a valid session, use it regardless of demo mode
    if (userId) {
      logger.debug('Authentication successful', {
        component: 'auth-middleware',
        userId,
        path: request?.nextUrl?.pathname,
        isDemo: isDemoMode
      });
      return {
        userId,
        isDemo: isDemoMode
      };
    }

    // No valid session - check if demo mode allows fallback
    if (isDemoMode) {
      const path = request?.nextUrl?.pathname;
      
      // SECURITY: Never allow demo fallback for sensitive endpoints
      const isDebugEndpoint = path?.includes('/api/debug');
      const isExportEndpoint = path?.includes('/api/export');
      
      if (isDebugEndpoint) {
        logger.warn('Debug endpoint blocked - requires real authentication', {
          component: 'auth-middleware',
          path
        });
        throw new UnauthorizedError('Debug endpoints require authentication');
      }
      
      if (isExportEndpoint) {
        logger.warn('Export endpoint blocked - requires real authentication', {
          component: 'auth-middleware', 
          path
        });
        throw new UnauthorizedError('Export endpoints require authentication');
      }
      
      // Allow demo fallback for basic endpoints only
      logger.warn('Demo mode fallback - using default user', {
        component: 'auth-middleware',
        path
      });
      return {
        userId: '68a33c99df2098d5e02a84e3',
        isDemo: true
      };
    }

    // Production or no demo mode - require valid authentication
    logger.warn('Authentication failed - no user ID', {
      component: 'auth-middleware',
      path: request?.nextUrl?.pathname
    });
    throw new UnauthorizedError('Authentication required');

  } catch (error) {
    logger.error('Authentication error', {
      component: 'auth-middleware',
      path: request?.nextUrl?.pathname
    }, error);

    if (error instanceof UnauthorizedError) {
      throw error;
    }

    throw new UnauthorizedError('Authentication failed');
  }
}

/**
 * Optional authentication - returns user ID if authenticated, null otherwise
 * Used for endpoints that work with or without authentication
 */
export async function optionalAuth(request?: NextRequest): Promise<AuthResult | null> {
  try {
    return await requireAuth(request);
  } catch (error) {
    logger.debug('Optional auth failed - proceeding without authentication', {
      component: 'auth-middleware',
      path: request?.nextUrl?.pathname
    });
    return null;
  }
}

/**
 * Middleware wrapper for API routes that require authentication
 */
export function withAuth<T extends unknown[]>(
  handler: (authResult: AuthResult, ...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const authResult = await requireAuth();
      return await handler(authResult, ...args);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: error.statusCode }
        );
      }

      logger.error('Auth middleware error', { component: 'auth-middleware' }, error);
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware wrapper for API routes with optional authentication
 */
export function withOptionalAuth<T extends unknown[]>(
  handler: (authResult: AuthResult | null, ...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const authResult = await optionalAuth();
      return await handler(authResult, ...args);
    } catch (error) {
      logger.error('Optional auth middleware error', { component: 'auth-middleware' }, error);
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
  };
}