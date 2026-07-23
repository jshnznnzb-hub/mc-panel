// Uses Node.js built-in sqlite (Node 22.5+) — no native compilation needed.
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), '..', '.data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'panel.db');
export const db = new DatabaseSync(DB_PATH);

db.exec(`PRAGMA journal_mode = WAL`);
db.exec(`PRAGMA foreign_keys = ON`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created  INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS servers (
    id       TEXT PRIMARY KEY,
    name     TEXT NOT NULL,
    version  TEXT NOT NULL,
    type     TEXT NOT NULL DEFAULT 'paper',
    ram      INTEGER NOT NULL DEFAULT 1024,
    port     INTEGER NOT NULL DEFAULT 25565,
    created  INTEGER DEFAULT (unixepoch())
  );
`);

export function seedAdmin(username: string, passwordPlain: string) {
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return;
  const hash = bcrypt.hashSync(passwordPlain, 10);
  db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hash);
  console.log(`[DB] Admin user "${username}" created.`);
}

const adminUser = process.env.ADMIN_USER || 'admin';
const adminPass = process.env.ADMIN_PASS || 'admin123';
seedAdmin(adminUser, adminPass);

export default db;
