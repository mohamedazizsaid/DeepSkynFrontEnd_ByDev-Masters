import { VALIDATION, ERROR_MESSAGES } from '../constants';

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  return VALIDATION.EMAIL_REGEX.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= VALIDATION.PASSWORD_MIN_LENGTH;
};

/**
 * Validate username format
 */
export const isValidUsername = (username: string): boolean => {
  return username.length >= VALIDATION.USERNAME_MIN_LENGTH && VALIDATION.USERNAME_REGEX.test(username);
};

/**
 * Validate file size and type
 */
export const isValidFile = (file: File): { valid: boolean; error?: string } => {
  if (file.size > VALIDATION.FILE_MAX_SIZE) {
    return { valid: false, error: ERROR_MESSAGES.FILE_TOO_LARGE };
  }

  if (!VALIDATION.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_FILE_TYPE };
  }

  return { valid: true };
};

/**
 * Validate login credentials
 */
export const validateLoginForm = (email: string, password: string): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!email) {
    errors.email = 'Email requis';
  } else if (!isValidEmail(email)) {
    errors.email = ERROR_MESSAGES.INVALID_EMAIL;
  }

  if (!password) {
    errors.password = 'Mot de passe requis';
  } else if (!isValidPassword(password)) {
    errors.password = ERROR_MESSAGES.PASSWORD_TOO_SHORT;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
