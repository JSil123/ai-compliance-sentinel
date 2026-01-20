const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const DB_PATH = path.join(__dirname, "sentinel.db");

async function getDb() {
  return open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
}

module.exports = { getDb, DB_PATH };
