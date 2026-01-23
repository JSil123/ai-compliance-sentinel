const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

let dbInstance = null;

async function getDb() {
  if (dbInstance) return dbInstance;

  const db = await open({
    filename: "./compliance.db",
    driver: sqlite3.Database
  });

  // 🔐 Create tables FIRST
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

  // 🌱 Seed data ONCE
  const row = await db.get(`SELECT COUNT(*) as count FROM laws`);

  if (row.count === 0) {
    console.log("🌱 Seeding mock compliance data...");

    await db.run(`
      INSERT INTO laws (name, jurisdiction, source_url)
      VALUES ('EU AI Act', 'EU', 'https://example.com/eu-ai-act')
    `);

    await db.run(`
      INSERT INTO requirements (law_id, requirement_code, title, text, keywords)
      VALUES (
        1,
        'AI-OVS-01',
        'Human Oversight',
        'High-risk AI systems must include human oversight.',
        'ai,human oversight,healthcare'
      )
    `);

    await db.run(`
      INSERT INTO policies (name, version, jurisdiction_scope)
      VALUES ('AI Governance Policy', '1.0', 'Global')
    `);

    await db.run(`
      INSERT INTO policy_controls (policy_id, control_code, title, text, keywords)
      VALUES (
        1,
        'AI-GOV-01',
        'Human Review',
        'AI outputs must be reviewed by a qualified human.',
        'ai,review,oversight'
      )
    `);
  }

  console.log("✅ Database ready");
  dbInstance = db;
  return db;
}

module.exports = { getDb };
