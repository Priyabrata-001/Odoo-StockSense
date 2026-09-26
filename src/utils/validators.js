/**
 * StockSense Validation Utilities
 * Form validation functions for authentication flows.
 *
 * Each function returns an object in the format:
 * { valid: boolean, message: string }
 */

/**
 * Validates login ID.
 * - Required
 * - Must be between 6 and 12 characters
 *
 * @param {string} loginId - The login ID to validate.
 * @returns {{ valid: boolean, message: string }}
 */
export function validateLoginId(loginId) {
  if (!loginId || typeof loginId !== 'string' || loginId.trim() === '') {
    return {
      valid: false,
      message: 'Login ID is required.'
    };
  }

  const trimmed = loginId.trim();
  if (trimmed.length < 6 || trimmed.length > 12) {
    return {
      valid: false,
      message: 'Login ID must be between 6 and 12 characters.'
    };
  }

  return {
    valid: true,
    message: ''
  };
}

/**
 * Validates email address format.
 * - Required
 * - Must be valid email format (using regex)
 *
 * @param {string} email - The email address to validate.
 * @returns {{ valid: boolean, message: string }}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return {
      valid: false,
      message: 'Email is required.'
    };
  }

  // Standard regex for validating email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return {
      valid: false,
      message: 'Please enter a valid email address.'
    };
  }

  return {
    valid: true,
    message: ''
  };
}

/**
 * Validates password strength.
 * - Required
 * - Must be more than 8 characters
 * - Must contain at least one lowercase letter
 * - Must contain at least one uppercase letter
 * - Must contain at least one special character
 *
 * @param {string} password - The password to validate.
 * @returns {{ valid: boolean, message: string }}
 */
export function validatePassword(password) {
  const errorMessage =
    'Password must contain an uppercase letter, lowercase letter, special character, and be more than 8 characters.';

  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      message: errorMessage
    };
  }

  // Must be more than 8 characters (> 8)
  const isMoreThan8Chars = password.length > 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);

  if (!isMoreThan8Chars || !hasLowercase || !hasUppercase || !hasSpecialChar) {
    return {
      valid: false,
      message: errorMessage
    };
  }

  return {
    valid: true,
    message: ''
  };
}

/**
 * Validates password confirmation.
 * - Required
 * - Must match password
 *
 * @param {string} password - The original password.
 * @param {string} confirmPassword - The confirmation password to check against.
 * @returns {{ valid: boolean, message: string }}
 */
export function validateConfirmPassword(password, confirmPassword) {
  if (
    !confirmPassword ||
    typeof confirmPassword !== 'string' ||
    confirmPassword.trim() === ''
  ) {
    return {
      valid: false,
      message: 'Please confirm your password.'
    };
  }

  if (confirmPassword !== password) {
    return {
      valid: false,
      message: 'Passwords do not match.'
    };
  }

  return {
    valid: true,
    message: ''
  };
}

export default {
  validateLoginId,
  validateEmail,
  validatePassword,
  validateConfirmPassword
};
