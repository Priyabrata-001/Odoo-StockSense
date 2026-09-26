/**
 * StockSense User Storage Utility
 * LocalStorage-based data access layer for user accounts and session persistence.
 * Designed as a clean abstraction that can be easily replaced with API calls in the future.
 */

const USERS_STORAGE_KEY = 'stocksense_users';
const CURRENT_USER_STORAGE_KEY = 'stocksense_current_user';

/**
 * Retrieves all registered users from localStorage.
 *
 * @returns {Array<{loginId: string, email: string, password: string}>} Array of users or empty array.
 */
export function getUsers() {
  try {
    const rawData = localStorage.getItem(USERS_STORAGE_KEY);
    if (!rawData) {
      return [];
    }
    const parsed = JSON.parse(rawData);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse users from localStorage:', error);
    return [];
  }
}

/**
 * Appends a new user to the users array in localStorage.
 * User is stored with schema { loginId, email, password }.
 *
 * @param {{loginId: string, email: string, password: string}} user
 * @returns {{loginId: string, email: string, password: string}} The saved user object.
 */
export function saveUser(user) {
  if (!user) {
    throw new Error('A user object is required to save.');
  }

  const users = getUsers();
  const newUser = {
    loginId: user.loginId,
    email: user.email,
    password: user.password
  };

  users.push(newUser);

  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Failed to save users to localStorage:', error);
    throw error;
  }

  return newUser;
}

/**
 * Finds a user by their login ID.
 *
 * @param {string} loginId - The login ID to search for.
 * @returns {{loginId: string, email: string, password: string} | null} The user object or null if not found.
 */
export function findUserByLoginId(loginId) {
  if (!loginId || typeof loginId !== 'string') {
    return null;
  }

  const users = getUsers();
  const targetId = loginId.trim();

  // Match exact loginId first, fallback to case-insensitive match
  const exactMatch = users.find((user) => user && user.loginId === targetId);
  if (exactMatch) {
    return exactMatch;
  }

  const lowerTargetId = targetId.toLowerCase();
  return (
    users.find(
      (user) =>
        user &&
        user.loginId &&
        user.loginId.toLowerCase() === lowerTargetId
    ) || null
  );
}

/**
 * Finds a user by their email address.
 *
 * @param {string} email - The email address to search for.
 * @returns {{loginId: string, email: string, password: string} | null} The user object or null if not found.
 */
export function findUserByEmail(email) {
  if (!email || typeof email !== 'string') {
    return null;
  }

  const users = getUsers();
  const targetEmail = email.trim();

  // Match exact email first, fallback to case-insensitive match
  const exactMatch = users.find((user) => user && user.email === targetEmail);
  if (exactMatch) {
    return exactMatch;
  }

  const lowerTargetEmail = targetEmail.toLowerCase();
  return (
    users.find(
      (user) =>
        user &&
        user.email &&
        user.email.toLowerCase() === lowerTargetEmail
    ) || null
  );
}

/**
 * Updates a user's password in localStorage.
 *
 * @param {string} loginId - The login ID of the user.
 * @param {string} newPassword - The new password to set.
 * @returns {boolean} True if the user was found and updated, false otherwise.
 */
export function updateUserPassword(loginId, newPassword) {
  if (!loginId) {
    return false;
  }

  const users = getUsers();
  const targetId = typeof loginId === 'string' ? loginId.trim() : loginId;

  // Search exact match index first
  let userIndex = users.findIndex((user) => user && user.loginId === targetId);

  // Fallback to case-insensitive index search
  if (userIndex === -1 && typeof targetId === 'string') {
    const lowerTargetId = targetId.toLowerCase();
    userIndex = users.findIndex(
      (user) =>
        user &&
        user.loginId &&
        user.loginId.toLowerCase() === lowerTargetId
    );
  }

  if (userIndex === -1) {
    return false;
  }

  users[userIndex].password = newPassword;

  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return true;
  } catch (error) {
    console.error('Failed to update user password in localStorage:', error);
    return false;
  }
}

/**
 * Retrieves the current session user from localStorage.
 *
 * @returns {{loginId: string, email: string} | null} The active user session or null.
 */
export function getCurrentUser() {
  try {
    const rawData = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (!rawData) {
      return null;
    }
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Failed to parse current user from localStorage:', error);
    return null;
  }
}

/**
 * Saves the active user session to localStorage.
 * Only saves { loginId, email }, explicitly excluding password.
 *
 * @param {{loginId: string, email: string, password?: string}} user
 * @returns {{loginId: string, email: string} | null} The saved session user object.
 */
export function setCurrentUser(user) {
  if (!user) {
    clearCurrentUser();
    return null;
  }

  const sessionUser = {
    loginId: user.loginId,
    email: user.email
  };

  try {
    localStorage.setItem(
      CURRENT_USER_STORAGE_KEY,
      JSON.stringify(sessionUser)
    );
    return sessionUser;
  } catch (error) {
    console.error('Failed to set current user in localStorage:', error);
    throw error;
  }
}

/**
 * Clears the active user session from localStorage.
 */
export function clearCurrentUser() {
  try {
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear current user from localStorage:', error);
  }
}

export default {
  getUsers,
  saveUser,
  findUserByLoginId,
  findUserByEmail,
  updateUserPassword,
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser
};
