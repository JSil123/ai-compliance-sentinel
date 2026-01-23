const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

let db;

async function getDb() {
  if (db) return db;

  db = await open({
    filename: path.join(__dirname, "compliance.db"),
    driver: sqlite3.Database
  });

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
  `);

  return db;
}

module.exports = { getDb };
