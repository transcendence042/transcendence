import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

// Determine where to put the secrets folder and DB file.
// For compatibility with the rest of the project we want the DB in `srcs/secrets`.
// Resolve from process.cwd() so this works when running from the repo root.
const secretsDir = path.resolve(process.cwd(), 'srcs', 'secrets');

// Ensure the secrets directory exists
if (!fs.existsSync(secretsDir)) {
  fs.mkdirSync(secretsDir, { recursive: true });
}

const db = new Database(path.join(secretsDir, 'app.db'));

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