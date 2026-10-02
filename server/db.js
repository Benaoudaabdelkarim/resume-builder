import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DB_PATH = path.join(DATA_DIR, 'app.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize SQLite database
export const db = new DatabaseSync(DB_PATH);

// Run initial schema migrations
db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
`);

/**
 * Hash a password using scrypt with random salt.
 */
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

/**
 * Verify a password against salt and stored hash using constant-time comparison.
 */
function verifyPassword(password, salt, storedHash) {
  const hash = crypto.scryptSync(password, salt, 64);
  const hashBuf = Buffer.from(storedHash, 'hex');
  if (hash.length !== hashBuf.length) return false;
  return crypto.timingSafeEqual(hash, hashBuf);
}

/**
 * Create a new user with name, email, and password.
 */
export function createUser(name, email, password) {
  if (!name || !name.trim()) {
    throw new Error('Name is required');
  }
  if (!email || !email.trim()) {
    throw new Error('Email is required');
  }
  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    throw new Error('Please enter a valid email address');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  // Check if email already exists
  const existingStmt = db.prepare('SELECT id FROM users WHERE email = ?');
  const existing = existingStmt.get(cleanEmail);
  if (existing) {
    throw new Error('An account with this email already exists');
  }

  const id = crypto.randomUUID();
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const createdAt = new Date().toISOString();

  const insertStmt = db.prepare(
    'INSERT INTO users (id, name, email, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertStmt.run(id, name.trim(), cleanEmail, passwordHash, salt, createdAt);

  return {
    id,
    name: name.trim(),
    email: cleanEmail,
    createdAt,
  };
}

/**
 * Authenticate user credentials.
 */
export function authenticateUser(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  const cleanEmail = email.trim().toLowerCase();

  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = stmt.get(cleanEmail);
  if (!user) {
    return null;
  }

  const isValid = verifyPassword(password, user.salt, user.password_hash);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
  };
}

/**
 * Create a session token for a user (valid for 30 days).
 */
export function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const stmt = db.prepare(
    'INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
  );
  stmt.run(token, userId, createdAt, expiresAt);

  return { token, expiresAt };
}

/**
 * Validate a session token and return the associated user.
 */
export function getUserBySession(token) {
  if (!token) return null;

  const stmt = db.prepare(`
    SELECT u.id, u.name, u.email, u.created_at, s.expires_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ?
  `);
  const record = stmt.get(token);
  if (!record) return null;

  // Check expiration
  if (new Date(record.expires_at) < new Date()) {
    deleteSession(token);
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    createdAt: record.created_at,
  };
}

/**
 * Delete a session (logout).
 */
export function deleteSession(token) {
  if (!token) return;
  const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
  stmt.run(token);
}

/**
 * Get user by ID.
 */
export function getUserById(id) {
  if (!id) return null;
  const stmt = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?');
  const record = stmt.get(id);
  if (!record) return null;
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    createdAt: record.created_at,
  };
}

/**
 * Update user password by email.
 */
export function updateUserPassword(email, newPassword) {
  if (!email || !email.trim()) {
    throw new Error('Email is required');
  }
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long');
  }

  const cleanEmail = email.trim().toLowerCase();
  const userStmt = db.prepare('SELECT id, name, email FROM users WHERE email = ?');
  const user = userStmt.get(cleanEmail);

  if (!user) {
    throw new Error(`No user found with email: ${cleanEmail}`);
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  const newPasswordHash = hashPassword(newPassword, newSalt);

  const updateStmt = db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?');
  updateStmt.run(newPasswordHash, newSalt, user.id);

  // Invalidate any active sessions for this user so they must re-authenticate
  const invalidateStmt = db.prepare('DELETE FROM sessions WHERE user_id = ?');
  invalidateStmt.run(user.id);

  return {
    success: true,
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
