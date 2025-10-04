import fs from 'fs';
import Database from 'better-sqlite3';

// Ensure the secrets directory exists
if (!fs.existsSync('./secrets')) {
  fs.mkdirSync('./secrets', { recursive: true });
}

const db = new Database('./secrets/app.db');

// Create users table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    email TEXT,
    fullName TEXT,
    address TEXT,
    phone TEXT,
    profilePicture TEXT,
    bio TEXT,
    birthdate TEXT,
    socialLinks TEXT,
    isAnonymized INTEGER DEFAULT 0
  )
`).run();

export default db;