/**
 * Standardized API response utilities
 * Provides consistent response formats across all endpoints
 */

import { NextResponse } from 'next/server';

export interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiPaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  pagination: PaginationInfo;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: string;
}

/**
 * Standardized API response utilities
 */
export const ApiResponse = {
  /**
   * Success response with data
   */
  success: <T>(data: T, message?: string, status: number = 200): NextResponse<ApiSuccessResponse<T>> => {
    return NextResponse.json(
      {
        success: true,
        data,
        ...(message && { message })
      },
      { status }
    );
  },

  /**
   * Success response for creation (201)
   */
  created: <T>(data: T, message: string = 'Resource created successfully'): NextResponse<ApiSuccessResponse<T>> => {
    return ApiResponse.success(data, message, 201);
  },

  /**
   * Success response for updates
   */
  updated: <T>(data: T, message: string = 'Resource updated successfully'): NextResponse<ApiSuccessResponse<T>> => {
    return ApiResponse.success(data, message, 200);
  },

  /**
   * Success response for deletions
   */
  deleted: (message: string = 'Resource deleted successfully'): NextResponse<ApiSuccessResponse<null>> => {
    return ApiResponse.success(null, message, 200);
  },

  /**
   * Paginated response with metadata
   */
  paginated: <T>(
    data: T[],
    pagination: PaginationInfo,
    message?: string
  ): NextResponse<ApiPaginatedResponse<T>> => {
    return NextResponse.json(
      {
        success: true,
        data,
        pagination,
        ...(message && { message })
      },
      { status: 200 }
    );
  },

  /**
   * Error response
   */
  error: (
    error: string,
    status: number = 500,
    code?: string,
    details?: string
  ): NextResponse<ApiErrorResponse> => {
    return NextResponse.json(
      {
        success: false,
        error,
        ...(code && { code }),
        ...(details && { details })
      },
      { status }
    );
  },

  /**
   * Bad request error (400)
   */
  badRequest: (error: string, details?: string): NextResponse<ApiErrorResponse> => {
    return ApiResponse.error(error, 400, 'BAD_REQUEST', details);
  },

  /**
   * Unauthorized error (401)
   */
  unauthorized: (error: string = 'Unauthorized'): NextResponse<ApiErrorResponse> => {
    return ApiResponse.error(error, 401, 'UNAUTHORIZED');
  },

  /**
   * Forbidden error (403)
   */
  forbidden: (error: string = 'Forbidden'): NextResponse<ApiErrorResponse> => {
    return ApiResponse.error(error, 403, 'FORBIDDEN');
  },

  /**
   * Not found error (404)
   */
  notFound: (resource: string = 'Resource'): NextResponse<ApiErrorResponse> => {
    return ApiResponse.error(`${resource} not found`, 404, 'NOT_FOUND');
  },

  /**
   * Conflict error (409)
   */
  conflict: (error: string): NextResponse<ApiErrorResponse> => {
    return ApiResponse.error(error, 409, 'CONFLICT');
  },

  /**
   * Validation error (422)
   */
  validationError: (details: string): NextResponse<ApiErrorResponse> => {
    return ApiResponse.error('Validation failed', 422, 'VALIDATION_ERROR', details);
  },

  /**
   * Internal server error (500)
   */
  internalError: (error: string = 'Internal server error'): NextResponse<ApiErrorResponse> => {
    return ApiResponse.error(error, 500, 'INTERNAL_ERROR');
  }
};

/**
 * Create pagination metadata
 */
export function createPagination(
  page: number,
  limit: number,
  totalCount: number
): PaginationInfo {
  const totalPages = Math.ceil(totalCount / limit);

  return {
    page,
    limit,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
}

/**
 * Calculate skip value for pagination
 */
export function getSkipValue(page: number, limit: number): number {
  return Math.max(0, (page - 1) * limit);
}

/**
 * Validate and sanitize pagination parameters
 */
export function sanitizePagination(
  page?: string | null,
  limit?: string | null,
  defaultLimit: number = 20,
  maxLimit: number = 100
): { page: number; limit: number; skip: number } {
  const sanitizedPage = Math.max(1, parseInt(page || '1') || 1);
  const sanitizedLimit = Math.min(
    maxLimit,
    Math.max(1, parseInt(limit || defaultLimit.toString()) || defaultLimit)
  );
  const skip = getSkipValue(sanitizedPage, sanitizedLimit);

  return {
    page: sanitizedPage,
    limit: sanitizedLimit,
    skip
  };
}