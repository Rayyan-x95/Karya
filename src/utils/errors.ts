export type ErrorType = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'NETWORK_ERROR'
  | 'STORAGE_ERROR'
  | 'UNKNOWN_ERROR';

export class AppError extends Error {
  public type: ErrorType;
  public details: any;

  constructor(type: ErrorType, message: string, details: any = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: any = null) {
    super('VALIDATION_ERROR', message, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, details: any = null) {
    super('AUTHENTICATION_ERROR', message, details);
  }
}

export class NetworkError extends AppError {
  constructor(message: string, details: any = null) {
    super('NETWORK_ERROR', message, details);
  }
}

export class StorageError extends AppError {
  constructor(message: string, details: any = null) {
    super('STORAGE_ERROR', message, details);
  }
}

export class UnknownError extends AppError {
  constructor(message: string, details: any = null) {
    super('UNKNOWN_ERROR', message, details);
  }
}

export function handleServiceError(error: any): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  // Handlers for Zod validation errors
  if (error?.name === 'ZodError') {
    return new ValidationError('Input validation failed', error.format());
  }

  // Supabase/Postgrest errors
  if (error?.code && error?.message) {
    return new NetworkError(`Database Error (${error.code}): ${error.message}`, error);
  }

  return new UnknownError(error?.message || 'An unexpected error occurred', error);
}
