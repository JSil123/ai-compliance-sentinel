async function runAnalysis(db) {
  // Ensure table exists
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

  // Clear old demo alerts
  await db.exec(`DELETE FROM alerts`);

  const now = new Date().toISOString();

  const demoAlerts = [
    {
      type: "New Regulation Detected",
      severity: "High",
      message:
        "A new AI-related regulatory obligation has been identified that may impact healthcare data usage.",
      jurisdiction: "EU",
      citations: JSON.stringify([
        { law: "EU AI Act", article: "Article 14", note: "Human oversight required" }
      ])
    },
    {
      type: "Model Transparency Gap",
      severity: "Medium",
      message:
        "The AI model lacks sufficient documentation for decision explainability.",
      jurisdiction: "EU",
      citations: JSON.stringify([
        { law: "EU AI Act", article: "Article 13" }
      ])
    },
    {
      type: "Data Retention Risk",
      severity: "Medium",
      message:
        "Training data retention exceeds recommended limits under internal policy.",
      jurisdiction: "US",
      citations: JSON.stringify([
        { policy: "AI Governance Policy", control: "AI-GOV-02" }
      ])
    }
  ];

  for (const a of demoAlerts) {
    await db.run(
      `
      INSERT INTO alerts (created_at, type, severity, message, jurisdiction, citations)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [now, a.type, a.severity, a.message, a.jurisdiction, a.citations]
    );
  }
}

module.exports = { runAnalysis };
