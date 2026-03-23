import { AppError, ApiError, AuthError, ValidationError } from './AppError';
import { ERROR_MESSAGES } from '../constants';

/**
 * Handle API errors and convert to user-friendly messages
 */
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 500:
        return ERROR_MESSAGES.SERVER_ERROR;
      default:
        return error.message || ERROR_MESSAGES.SERVER_ERROR;
    }
  }

  if (error instanceof ValidationError) {
    return error.message;
  }

  if (error instanceof AuthError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return ERROR_MESSAGES.SERVER_ERROR;
};

/**
 * Check if error is network-related
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.toLowerCase().includes('connection')
    );
  }
  return false;
};

/**
 * Safe error message getter
 */
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.message === 'string') return err.message;
  }
  return ERROR_MESSAGES.SERVER_ERROR;
};
