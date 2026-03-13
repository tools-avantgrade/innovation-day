const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'tgii.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better concurrent reads
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS slots (
    id INTEGER PRIMARY KEY CHECK (id BETWEEN 1 AND 3),
    speaker TEXT,
    topic TEXT,
    booked_at TEXT,
    session_date TEXT
  );

  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_id INTEGER NOT NULL,
    speaker TEXT NOT NULL,
    topic TEXT NOT NULL,
    session_date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transcripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_date TEXT NOT NULL UNIQUE,
    raw_text TEXT NOT NULL,
    uploaded_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_date TEXT NOT NULL,
    speaker TEXT NOT NULL,
    summary TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed the 3 slots if they don't exist
const existingSlots = db.prepare('SELECT COUNT(*) as count FROM slots').get();
if (existingSlots.count === 0) {
  const insert = db.prepare('INSERT INTO slots (id, speaker, topic, booked_at, session_date) VALUES (?, NULL, NULL, NULL, NULL)');
  insert.run(1);
  insert.run(2);
  insert.run(3);
}

module.exports = db;
