const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

let db;

async function getDb() {
  if (db) return db;

  db = await open({
    filename: "./compliance.db",
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      severity TEXT,
      message TEXT,
      recommended_owner TEXT,
      jurisdiction TEXT,
      citations TEXT,
      status TEXT DEFAULT 'OPEN',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS laws (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      jurisdiction TEXT
    );

    CREATE TABLE IF NOT EXISTS requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      law_id INTEGER,
      requirement_code TEXT,
      title TEXT,
      text TEXT
    );
  `);

  return db;
}

module.exports = { getDb };
