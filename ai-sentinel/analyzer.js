async function runAnalysis(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT,
      type TEXT,
      severity TEXT,
      message TEXT,
      jurisdiction TEXT,
      citations TEXT
    )
  `);

  // Clear old alerts for clean demo runs
  await db.exec(`DELETE FROM alerts`);

  const now = new Date().toISOString();

  const demoAlerts = [
    {
      type: "New Regulation Detected",
      severity: "High",
      message:
        "A new AI-related regulatory obligation has been identified that may impact healthcare data usage.",
      jurisdiction: "EU",
      citations: [{ law: "EU AI Act", article: "Article 14" }]
    },
    {
      type: "Data Retention Risk",
      severity: "Medium",
      message:
        "AI training datasets exceed recommended data retention thresholds.",
      jurisdiction: "US",
      citations: [{ law: "GDPR", article: "Article 5" }]
    },
    {
      type: "Human Oversight Gap",
      severity: "High",
      message:
        "No documented human-in-the-loop process for high-risk AI decisions.",
      jurisdiction: "EU",
      citations: [{ law: "EU AI Act", article: "Article 14" }]
    },
    {
      type: "Model Transparency Issue",
      severity: "Low",
      message:
        "Model documentation does not fully describe training data sources.",
      jurisdiction: "GLOBAL",
      citations: [{ law: "ISO 23894", article: "Section 6" }]
    }
  ];

  for (const a of demoAlerts) {
    await db.run(
      `
      INSERT INTO alerts
      (created_at, type, severity, message, jurisdiction, citations)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [
        now,
        a.type,
        a.severity,
        a.message,
        a.jurisdiction,
        JSON.stringify(a.citations)
      ]
    );
  }
}

module.exports = { runAnalysis };
