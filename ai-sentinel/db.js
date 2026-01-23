const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

async function getDb() {
  const db = await open({
    filename: "./compliance.db",
    driver: sqlite3.Database
  });

  // 🔐 Core tables (created if missing)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      severity TEXT,
      message TEXT,
      source TEXT,
      status TEXT,
      recommended_owner TEXT,
      jurisdiction TEXT,
      citations TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS laws (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      jurisdiction TEXT,
      source_url TEXT
    );

    CREATE TABLE IF NOT EXISTS requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      law_id INTEGER,
      requirement_code TEXT,
      title TEXT,
      text TEXT,
      keywords TEXT
    );

    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      version TEXT,
      jurisdiction_scope TEXT
    );

    CREATE TABLE IF NOT EXISTS policy_controls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_id INTEGER,
      control_code TEXT,
      title TEXT,
      text TEXT,
      keywords TEXT
    );
  `);

  return db;
}

module.exports = { getDb };
