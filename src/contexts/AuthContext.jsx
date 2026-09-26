import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getUsers,
  saveUser,
  findUserByLoginId,
  findUserByEmail,
  updateUserPassword,
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser
} from '../utils/userStorage.js';
import {
  validateLoginId,
  validateEmail,
  validatePassword,
  validateConfirmPassword
} from '../utils/validators.js';

/**
 * Helper to normalize validation outputs from various validator styles:
 * Supports:
 * - { valid: false, message: '...' }
 * - { isValid: false, error: '...' }
 * - String error message
 * - Boolean false
 *
 * @param {*} validationResult
 * @returns {string} Error message or empty string if valid
 */
const extractErrorMessage = (validationResult) => {
  if (!validationResult) return '';
  if (typeof validationResult === 'string') return validationResult.trim();
  if (typeof validationResult === 'object') {
    if (validationResult.valid === false) {
      return validationResult.message || 'Invalid value';
    }
    if (validationResult.isValid === false) {
      return validationResult.error || validationResult.message || 'Invalid value';
    }
    if (validationResult.valid === true || validationResult.isValid === true) {
      return '';
    }
    if (validationResult.message && !validationResult.valid) {
      return validationResult.message;
    }
    if (validationResult.error && !validationResult.isValid) {
      return validationResult.error;
    }
  }
  if (validationResult === false) return 'Invalid value';
  return '';
};

// Create Auth Context
export const AuthContext = createContext(null);

/**
 * AuthProvider component to wrap application and supply authentication state and actions.
 */
export const AuthProvider = ({ children }) => {
  // Rehydrate initial state immediately if stored session exists
  const [currentUser, setCurrentUserState] = useState(() => {
    try {
      return getCurrentUser() || null;
    } catch (err) {
      console.error('Error reading initial user from storage:', err);
      return null;
    }
  });

  // Rehydrate currentUser on mount
  useEffect(() => {
    try {
      const storedUser = getCurrentUser();
      if (storedUser) {
        setCurrentUserState(storedUser);
      }
    } catch (error) {
      console.error('Failed to rehydrate current user session:', error);
    }
  }, []);

  /**
   * Login user with loginId and password
   *
   * @param {string} loginId
   * @param {string} password
   * @returns {{ success: boolean, message: string }}
   */
  const login = (loginId, password) => {
    if (!loginId || !password) {
      return {
        success: false,
        message: 'Please enter both Login ID and password.'
      };
    }

    const trimmedLoginId = typeof loginId === 'string' ? loginId.trim() : loginId;

    // Look up user by loginId (with email fallback if identifier contains @)
    let user = findUserByLoginId(trimmedLoginId);
    if (!user && typeof trimmedLoginId === 'string' && trimmedLoginId.includes('@')) {
      user = findUserByEmail(trimmedLoginId);
    }

    if (!user) {
      return {
        success: false,
        message: 'Invalid Login ID or password.'
      };
    }

    if (user.password !== password) {
      return {
        success: false,
        message: 'Invalid Login ID or password.'
      };
    }

    // Persist session and update state
    setCurrentUser(user);
    setCurrentUserState(user);

    return {
      success: true,
      message: 'Login successful.'
    };
  };

  /**
   * Register a new user, validate all fields, enforce uniqueness, save user and auto-login
   *
   * @param {string} loginId
   * @param {string} email
   * @param {string} password
   * @param {string} confirmPassword
   * @returns {{ success: boolean, errors: { loginId: string, email: string, password: string, confirmPassword: string }, user?: object }}
   */
  const signup = (loginId, email, password, confirmPassword) => {
    const errors = {
      loginId: '',
      email: '',
      password: '',
      confirmPassword: ''
    };

    let hasError = false;

    // 1. Validate Login ID
    const loginIdError = extractErrorMessage(validateLoginId(loginId));
    if (loginIdError) {
      errors.loginId = loginIdError;
      hasError = true;
    } else if (findUserByLoginId(typeof loginId === 'string' ? loginId.trim() : loginId)) {
      errors.loginId = 'Login ID is already registered.';
      hasError = true;
    }

    // 2. Validate Email
    const emailError = extractErrorMessage(validateEmail(email));
    if (emailError) {
      errors.email = emailError;
      hasError = true;
    } else if (findUserByEmail(typeof email === 'string' ? email.trim().toLowerCase() : email)) {
      errors.email = 'Email is already registered.';
      hasError = true;
    }

    // 3. Validate Password
    const passwordError = extractErrorMessage(validatePassword(password));
    if (passwordError) {
      errors.password = passwordError;
      hasError = true;
    }

    // 4. Validate Confirm Password
    let confirmPasswordError = extractErrorMessage(validateConfirmPassword(password, confirmPassword));
    if (!confirmPasswordError && password !== confirmPassword) {
      confirmPasswordError = 'Passwords do not match.';
    }
    if (confirmPasswordError) {
      errors.confirmPassword = confirmPasswordError;
      hasError = true;
    }

    // If validation fails, return errors
    if (hasError) {
      return {
        success: false,
        errors
      };
    }

    // Create new user record
    const newUser = {
      id: Date.now().toString(),
      loginId: typeof loginId === 'string' ? loginId.trim() : loginId,
      email: typeof email === 'string' ? email.trim().toLowerCase() : email,
      password,
      createdAt: new Date().toISOString()
    };

    // Save user to storage
    saveUser(newUser);

    // Auto-login newly registered user
    setCurrentUser(newUser);
    setCurrentUserState(newUser);

    return {
      success: true,
      errors
    };
  };

  /**
   * Log out current user and clear stored session
   */
  const logout = () => {
    clearCurrentUser();
    setCurrentUserState(null);
  };

  /**
   * Reset user password by Login ID or Email
   *
   * @param {string} identifier - Login ID or Email
   * @param {string} newPassword - New password
   * @returns {{ success: boolean, message: string }}
   */
  const resetPassword = (identifier, newPassword) => {
    if (!identifier || !newPassword) {
      return {
        success: false,
        message: 'Identifier and new password are required.'
      };
    }

    const trimmedIdentifier = typeof identifier === 'string' ? identifier.trim() : identifier;

    // Find user by loginId OR email
    const user = findUserByLoginId(trimmedIdentifier) || findUserByEmail(trimmedIdentifier);

    if (!user) {
      return {
        success: false,
        message: 'No account found with the provided Login ID or Email.'
      };
    }

    // Validate new password rules
    const passwordError = extractErrorMessage(validatePassword(newPassword));
    if (passwordError) {
      return {
        success: false,
        message: passwordError
      };
    }

    // Update stored password
    updateUserPassword(user.loginId, newPassword);

    // If the reset password belongs to currently logged in user, synchronize state
    if (
      currentUser &&
      (currentUser.loginId === user.loginId || currentUser.email === user.email)
    ) {
      const updatedUser = { ...currentUser, password: newPassword };
      setCurrentUser(updatedUser);
      setCurrentUserState(updatedUser);
    }

    return {
      success: true,
      message: 'Password reset successfully.'
    };
  };

  // Derived authentication status
  const isAuthenticated = currentUser !== null;

  const value = {
    currentUser,
    isAuthenticated,
    login,
    signup,
    logout,
    resetPassword,
    getUsers,
    user: currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to consume the AuthContext
 *
 * @returns {object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
