// analyzer.js
module.exports.runAnalysis = async function runAnalysis(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      severity TEXT,
      message TEXT,
      jurisdiction TEXT,
      status TEXT,
      created_at TEXT,
      citations TEXT
    )
  `);

  // Clear old demo alerts (keeps demo clean)
  await db.exec(`DELETE FROM alerts`);

  const demoAlerts = [
    {
      type: "New Regulation Detected",
      severity: "High",
      message:
        "A new AI regulatory obligation has been identified affecting healthcare data usage.",
      jurisdiction: "EU",
      status: "OPEN",
      citations: JSON.stringify([
        { law: "EU AI Act", article: "Article 14" }
      ])
    },
    {
      type: "Model Transparency Gap",
      severity: "Medium",
      message:
        "AI model documentation lacks required explainability artifacts.",
      jurisdiction: "EU",
      status: "ACKNOWLEDGED",
      citations: JSON.stringify([
        { law: "EU AI Act", article: "Article 13" }
      ])
    },
    {
      type: "Data Retention Risk",
      severity: "Medium",
      message:
        "Training data retention exceeds defined internal policy limits.",
      jurisdiction: "US",
      status: "OPEN",
      citations: JSON.stringify([
        { law: "HIPAA", article: "164.306" }
      ])
    },
    {
      type: "Human Oversight Missing",
      severity: "High",
      message:
        "No documented human oversight mechanism exists for high-risk AI decisions.",
      jurisdiction: "EU",
      status: "OPEN",
      citations: JSON.stringify([
        { law: "EU AI Act", article: "Article 14" }
      ])
    },
    {
      type: "Cross-Border Transfer Review",
      severity: "Low",
      message:
        "AI data processing involves cross-border transfers requiring review.",
      jurisdiction: "GLOBAL",
      status: "RESOLVED",
      citations: JSON.stringify([
        { law: "GDPR", article: "Chapter V" }
      ])
    }
  ];

  for (const a of demoAlerts) {
    await db.run(
      `
      INSERT INTO alerts (type, severity, message, jurisdiction, status, created_at, citations)
      VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
      `,
      [
        a.type,
        a.severity,
        a.message,
        a.jurisdiction,
        a.status,
        a.citations
      ]
    );
  }

  console.log("✅ Demo alerts seeded");
};
