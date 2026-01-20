import sqlite3 from "sqlite3";
import { open } from "sqlite";

export function getDb() {
  return open({
    filename: "./compliance.db",
    driver: sqlite3.Database
  });
}


