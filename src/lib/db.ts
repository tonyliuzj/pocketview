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
    auth_method TEXT NOT NULL DEFAULT 'api_key',
    beszel_api_key TEXT,
    beszel_email TEXT,
    beszel_password TEXT,
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

// Migrate existing config table to add new auth columns
try {
  const tableInfo = db.prepare("PRAGMA table_info(config)").all() as Array<{ name: string }>;
  const columnNames = tableInfo.map(col => col.name);

  if (!columnNames.includes('auth_method')) {
    console.log('Migrating config table: adding auth_method, beszel_email, beszel_password columns');
    db.exec(`
      ALTER TABLE config ADD COLUMN auth_method TEXT NOT NULL DEFAULT 'api_key';
      ALTER TABLE config ADD COLUMN beszel_email TEXT;
      ALTER TABLE config ADD COLUMN beszel_password TEXT;
    `);
    // Make beszel_api_key nullable by recreating the table
    db.exec(`
      CREATE TABLE config_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        beszel_url TEXT NOT NULL,
        auth_method TEXT NOT NULL DEFAULT 'api_key',
        beszel_api_key TEXT,
        beszel_email TEXT,
        beszel_password TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO config_new (id, beszel_url, auth_method, beszel_api_key, beszel_email, beszel_password, created_at, updated_at)
      SELECT id, beszel_url, auth_method, beszel_api_key, beszel_email, beszel_password, created_at, updated_at FROM config;
      DROP TABLE config;
      ALTER TABLE config_new RENAME TO config;
    `);
    console.log('Migration completed successfully');
  }
} catch (error) {
  console.log('Database migration check:', error);
}

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
  auth_method: 'api_key' | 'password';
  beszel_api_key: string | null;
  beszel_email: string | null;
  beszel_password: string | null;
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

export function saveConfig(
  beszel_url: string,
  auth_method: 'api_key' | 'password',
  beszel_api_key?: string,
  beszel_email?: string,
  beszel_password?: string
): Config {
  const existing = getConfig();

  if (existing) {
    const stmt = db.prepare(`
      UPDATE config
      SET beszel_url = ?, auth_method = ?, beszel_api_key = ?, beszel_email = ?, beszel_password = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(beszel_url, auth_method, beszel_api_key || null, beszel_email || null, beszel_password || null, existing.id);
    return getConfig()!;
  } else {
    const stmt = db.prepare(`
      INSERT INTO config (beszel_url, auth_method, beszel_api_key, beszel_email, beszel_password)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(beszel_url, auth_method, beszel_api_key || null, beszel_email || null, beszel_password || null);
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

export async function getBeszelAuthHeaders(config: Config): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.auth_method === 'api_key' && config.beszel_api_key) {
    headers['Authorization'] = `Bearer ${config.beszel_api_key}`;
  } else if (config.auth_method === 'password' && config.beszel_email && config.beszel_password) {
    // For password auth, we need to authenticate first and get a token
    const authResponse = await fetch(`${config.beszel_url}/api/collections/users/auth-with-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identity: config.beszel_email,
        password: config.beszel_password,
      }),
    });

    if (!authResponse.ok) {
      throw new Error(`Beszel authentication failed: ${authResponse.status} ${authResponse.statusText}`);
    }

    const authData = await authResponse.json();
    headers['Authorization'] = `Bearer ${authData.token}`;
  }

  return headers;
}

export default db;
