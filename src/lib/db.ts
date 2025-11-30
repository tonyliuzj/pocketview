import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dbDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dbDir, 'pocketview.db');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    beszel_url TEXT NOT NULL,
    beszel_api_key TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create default admin user if no users exist
try {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const defaultPasswordHash = bcrypt.hashSync('changeme', 10);
    db.prepare('INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)').run('admin', defaultPasswordHash);
  }
} catch (error) {
  // Ignore errors during initialization (e.g., during build process)
  console.log('Database initialization: user table setup');
}

export interface Config {
  id: number;
  beszel_url: string;
  beszel_api_key: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export function getConfig(): Config | null {
  const stmt = db.prepare('SELECT * FROM config ORDER BY id DESC LIMIT 1');
  return stmt.get() as Config | null;
}

export function saveConfig(beszel_url: string, beszel_api_key: string): Config {
  const existing = getConfig();

  if (existing) {
    const stmt = db.prepare(`
      UPDATE config
      SET beszel_url = ?, beszel_api_key = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(beszel_url, beszel_api_key, existing.id);
    return getConfig()!;
  } else {
    const stmt = db.prepare(`
      INSERT INTO config (beszel_url, beszel_api_key)
      VALUES (?, ?)
    `);
    stmt.run(beszel_url, beszel_api_key);
    return getConfig()!;
  }
}

export function getUserByUsername(username: string): User | null {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username) as User | null;
}

export function verifyPassword(username: string, password: string): boolean {
  const user = getUserByUsername(username);
  if (!user) return false;
  return bcrypt.compareSync(password, user.password_hash);
}

export function updateUserCredentials(oldUsername: string, newUsername: string, newPassword?: string): boolean {
  try {
    const user = getUserByUsername(oldUsername);
    if (!user) return false;

    if (newPassword) {
      const passwordHash = bcrypt.hashSync(newPassword, 10);
      const stmt = db.prepare(`
        UPDATE users
        SET username = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(newUsername, passwordHash, user.id);
    } else {
      const stmt = db.prepare(`
        UPDATE users
        SET username = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(newUsername, user.id);
    }
    return true;
  } catch (error) {
    console.error('Error updating user credentials:', error);
    return false;
  }
}

export default db;
