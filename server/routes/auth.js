import { Router } from 'express';
import db from '../db.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { loginId, password } = req.body;
  if (!loginId || !password) {
    return res.status(400).json({ success: false, message: 'Please enter both Login ID and password.' });
  }

  const trimmed = loginId.trim();
  let user = db.prepare('SELECT * FROM users WHERE loginId = ?').get(trimmed);
  if (!user && trimmed.includes('@')) {
    user = db.prepare('SELECT * FROM users WHERE email = ?').get(trimmed.toLowerCase());
  }

  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid Login ID or password.' });
  }

  const { password: _, ...safeUser } = user;
  res.json({ success: true, message: 'Login successful.', user: safeUser });
});

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { loginId, email, password } = req.body;
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

  if (errors.loginId || errors.email || errors.password) {
    return res.status(400).json({ success: false, errors });
  }

  const trimmedLogin = loginId.trim();
  const trimmedEmail = email.trim().toLowerCase();

  const existingLogin = db.prepare('SELECT id FROM users WHERE loginId = ?').get(trimmedLogin);
  if (existingLogin) {
    errors.loginId = 'Login ID is already registered.';
    return res.status(400).json({ success: false, errors });
  }

  const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
  if (existingEmail) {
    errors.email = 'Email is already registered.';
    return res.status(400).json({ success: false, errors });
  }

  const result = db.prepare(
    'INSERT INTO users (loginId, email, password, createdAt) VALUES (?, ?, ?, datetime("now"))'
  ).run(trimmedLogin, trimmedEmail, password);

  const newUser = { id: result.lastInsertRowid, loginId: trimmedLogin, email: trimmedEmail };
  res.status(201).json({ success: true, errors, user: newUser });
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  const { identifier, newPassword } = req.body;
  if (!identifier || !newPassword) {
    return res.status(400).json({ success: false, message: 'Identifier and new password are required.' });
  }

  const trimmed = identifier.trim();
  let user = db.prepare('SELECT * FROM users WHERE loginId = ?').get(trimmed);
  if (!user) {
    user = db.prepare('SELECT * FROM users WHERE email = ?').get(trimmed.toLowerCase());
  }

  if (!user) {
    return res.status(404).json({ success: false, message: 'No account found with the provided Login ID or Email.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword, user.id);
  res.json({ success: true, message: 'Password reset successfully.' });
});

export default router;
