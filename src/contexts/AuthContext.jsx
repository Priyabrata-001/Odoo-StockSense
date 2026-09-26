import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiLogin, apiSignup, apiResetPassword } from '../utils/api.js';

// Create Auth Context
export const AuthContext = createContext(null);

/**
 * AuthProvider component to wrap application and supply authentication state and actions.
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState(() => {
    try {
      const stored = localStorage.getItem('stocksense_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const persistUser = (user) => {
    if (user) {
      localStorage.setItem('stocksense_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('stocksense_current_user');
    }
    setCurrentUserState(user);
  };

  /**
   * Login user with loginId and password
   */
  const login = async (loginId, password) => {
    if (!loginId || !password) {
      return { success: false, message: 'Please enter both Login ID and password.' };
    }

    try {
      const data = await apiLogin(loginId, password);
      persistUser(data.user);
      return { success: true, message: 'Login successful.' };
    } catch (err) {
      return { success: false, message: err.data?.message || 'Invalid Login ID or password.' };
    }
  };

  /**
   * Register a new user
   */
  const signup = async (loginId, email, password, confirmPassword) => {
    const errors = { loginId: '', email: '', password: '', confirmPassword: '' };

    if (!loginId || loginId.trim().length < 3) {
      errors.loginId = 'Login ID must be at least 3 characters.';
    }
    if (!email || !email.includes('@')) {
      errors.email = 'Please enter a valid email.';
    }
    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (errors.loginId || errors.email || errors.password || errors.confirmPassword) {
      return { success: false, errors };
    }

    try {
      const data = await apiSignup(loginId, email, password);
      persistUser(data.user);
      return { success: true, errors };
    } catch (err) {
      const serverErrors = err.data?.errors || {};
      return {
        success: false,
        errors: { ...errors, ...serverErrors }
      };
    }
  };

  /**
   * Log out current user
   */
  const logout = () => {
    persistUser(null);
  };

  /**
   * Reset user password
   */
  const resetPassword = async (identifier, newPassword) => {
    if (!identifier || !newPassword) {
      return { success: false, message: 'Identifier and new password are required.' };
    }

    try {
      const data = await apiResetPassword(identifier, newPassword);
      return { success: true, message: data.message || 'Password reset successfully.' };
    } catch (err) {
      return { success: false, message: err.data?.message || 'Failed to reset password.' };
    }
  };

  const isAuthenticated = currentUser !== null;

  const value = {
    currentUser,
    isAuthenticated,
    login,
    signup,
    logout,
    resetPassword,
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
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
