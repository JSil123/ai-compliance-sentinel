module.exports.runAnalysis = async function runAnalysis(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      severity TEXT,
      message TEXT,
      jurisdiction TEXT,
      status TEXT,
      created_at TEXT,
      citations TEXT
    )
  `);

  await db.exec(`DELETE FROM alerts`);

  const alerts = [
    {
      title: "New Regulation Detected",
      severity: "HIGH",
      message: "EU AI Act introduces new human oversight requirements.",
      jurisdiction: "EU",
      status: "OPEN",
      citations: [{ law: "EU AI Act", article: "Article 14" }]
    },
    {
      title: "Model Transparency Gap",
      severity: "MEDIUM",
      message: "Model documentation insufficient for explainability.",
      jurisdiction: "EU",
      status: "ACKNOWLEDGED",
      citations: [{ law: "EU AI Act", article: "Article 13" }]
    },
    {
      title: "Data Retention Risk",
      severity: "MEDIUM",
      message: "Training data retention exceeds policy thresholds.",
      jurisdiction: "US",
      status: "OPEN",
      citations: [{ law: "HIPAA", article: "164.306" }]
    },
    {
      title: "Human Oversight Missing",
      severity: "HIGH",
      message: "No documented human review for AI decisions.",
      jurisdiction: "EU",
      status: "OPEN",
      citations: [{ law: "EU AI Act", article: "Article 14" }]
    },
    {
      title: "Cross-Border Transfer Review",
      severity: "LOW",
      message: "AI data crosses borders and requires legal review.",
      jurisdiction: "GLOBAL",
      status: "RESOLVED",
      citations: [
  {
    law: "EU AI Act",
    article: "Article 13",
    summary: "Requires sufficient documentation and transparency to enable interpretation of AI system outputs."
  }
]

    }
  ];

  for (const a of alerts) {
    await db.run(
      `INSERT INTO alerts (title, severity, message, jurisdiction, status, created_at, citations)
       VALUES (?, ?, ?, ?, ?, datetime('now'), ?)`,
      [
        a.title,
        a.severity,
        a.message,
        a.jurisdiction,
        a.status,
        JSON.stringify(a.citations)
      ]
    );
  }
};

