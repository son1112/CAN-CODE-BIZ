/**
 * Standardized error handling utilities for API routes and components
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

export interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

export interface FieldValidationError {
  field: string;
  message: string;
}

export class AppError extends Error {
  public statusCode: number;
  public code?: string;
  public details?: string;

  constructor(message: string, statusCode: number = 500, code?: string, details?: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// Common error types
export class ValidationRequestError extends AppError {
  constructor(message: string, details?: string) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationRequestError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', details?: string) {
    super(message, 500, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, details?: string) {
    super(`External service error: ${service}`, 502, 'EXTERNAL_SERVICE_ERROR', details);
    this.name = 'ExternalServiceError';
  }
}

/**
 * Handles errors in API routes with proper logging and response formatting
 */
export function handleApiError(
  error: unknown,
  component: string,
  context?: Record<string, string | number | boolean | string[] | null | undefined>
): NextResponse<ErrorResponse> {
  // Log the error
  logger.error(`API error in ${component}`, { component, ...context }, error);

  // Handle known error types
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details
      },
      { status: error.statusCode }
    );
  }

  // Handle specific built-in error types
  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { error: 'Invalid JSON in request body', code: 'INVALID_JSON' },
      { status: 400 }
    );
  }

  if (error instanceof TypeError) {
    return NextResponse.json(
      { error: 'Invalid request data', code: 'INVALID_DATA' },
      { status: 400 }
    );
  }

  // Handle database-specific errors
  if (error instanceof Error) {
    if (error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Resource already exists', code: 'DUPLICATE_RESOURCE' },
        { status: 409 }
      );
    }
    
    if (error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid data provided', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    
    if (error.message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Request timeout', code: 'TIMEOUT' },
        { status: 504 }
      );
    }
    
    if (error.message.includes('connection')) {
      return NextResponse.json(
        { error: 'Service unavailable', code: 'SERVICE_UNAVAILABLE' },
        { status: 503 }
      );
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Resource not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
  }

  // Default internal server error
  return NextResponse.json(
    { 
      error: 'Internal server error', 
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    },
    { status: 500 }
  );
}

/**
 * Validates request body against a schema-like validator function
 */
export function validateRequest<T>(
  data: unknown,
  validator: (data: unknown) => { isValid: boolean; errors: FieldValidationError[] },
  component: string
): T {
  const { isValid, errors } = validator(data);
  
  if (!isValid) {
    const errorMessages = errors.map(e => `${e.field}: ${e.message}`).join(', ');
    logger.warn('Request validation failed', { component, errorCount: errors.length });
    throw new ValidationRequestError('Request validation failed', errorMessages);
  }
  
  return data as T;
}

/**
 * Validates query parameters with basic type checking and sanitization
 */
export function validateQueryParams(searchParams: URLSearchParams) {
  const getIntParam = (name: string, defaultValue: number, min?: number, max?: number): number => {
    const value = searchParams.get(name);
    if (!value) return defaultValue;
    
    const parsed = parseInt(value);
    if (isNaN(parsed)) {
      throw new ValidationRequestError(`Invalid ${name} parameter: must be a number`);
    }
    
    if (min !== undefined && parsed < min) {
      throw new ValidationRequestError(`Invalid ${name} parameter: must be at least ${min}`);
    }
    
    if (max !== undefined && parsed > max) {
      throw new ValidationRequestError(`Invalid ${name} parameter: must be at most ${max}`);
    }
    
    return parsed;
  };

  const getStringParam = (name: string, defaultValue: string = '', maxLength?: number): string => {
    const value = searchParams.get(name)?.trim() || defaultValue;
    
    if (maxLength && value.length > maxLength) {
      throw new ValidationRequestError(`Invalid ${name} parameter: must be less than ${maxLength} characters`);
    }
    
    return value;
  };

  const getArrayParam = (name: string, maxItems?: number): string[] => {
    const value = searchParams.get(name);
    if (!value) return [];
    
    const array = value.split(',').filter(Boolean);
    
    if (maxItems && array.length > maxItems) {
      throw new ValidationRequestError(`Invalid ${name} parameter: maximum ${maxItems} items allowed`);
    }
    
    return array;
  };

  return {
    getIntParam,
    getStringParam,
    getArrayParam
  };
}

/**
 * Wraps an async function to handle errors consistently
 */
export function asyncErrorHandler<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  component: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      // Re-throw AppErrors as-is
      if (error instanceof AppError) {
        throw error;
      }
      
      // Wrap other errors
      logger.error(`Unexpected error in ${component}`, { component }, error);
      throw new AppError('Internal server error', 500, 'INTERNAL_ERROR');
    }
  };
}