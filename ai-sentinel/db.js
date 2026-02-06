const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "compliance.db"));

module.exports.getDb = async () => {
  return {
    run: (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.run(sql, params, err => (err ? reject(err) : resolve()));
      }),
    all: (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
      }),
    exec: sql =>
      new Promise((resolve, reject) => {
        db.exec(sql, err => (err ? reject(err) : resolve()));
      })
  };
};
