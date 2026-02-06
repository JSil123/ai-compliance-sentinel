// analyzer.js
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

  // Clear old demo alerts (keeps demo clean)
  await db.exec(`DELETE FROM alerts`);

  const alerts = [
    {
      title: "New Regulation Detected",
      severity: "HIGH",
      message: "A new AI regulatory obligation has been identified that impacts healthcare data usage and governance controls.",
      jurisdiction: "EU",
      status: "OPEN",
      citations: [
        {
          law: "EU AI Act",
          article: "Article 14",
          summary: "High-risk AI systems must include effective human oversight to prevent or minimize risks to health, safety, and fundamental rights."
        }
      ]
    },
    {
      title: "Model Transparency Gap",
      severity: "MEDIUM",
      message: "Model documentation is insufficient to support explainability and audit review.",
      jurisdiction: "EU",
      status: "ACKNOWLEDGED",
      citations: [
        {
          law: "EU AI Act",
          article: "Article 13",
          summary: "High-risk AI systems must provide transparent information and documentation enabling users to interpret outputs appropriately."
        }
      ]
    },
    {
      title: "Data Retention Risk",
      severity: "MEDIUM",
      message: "Training data retention exceeds defined limits and may violate internal retention policies or sector-specific requirements.",
      jurisdiction: "US",
      status: "OPEN",
      citations: [
        {
          law: "HIPAA Security Rule",
          article: "45 CFR § 164.306",
          summary: "Covered entities must ensure confidentiality, integrity, and availability of electronic protected health information (ePHI) through reasonable safeguards."
        }
      ]
    },
    {
      title: "Human Oversight Missing",
      severity: "HIGH",
      message: "No documented human review process exists for high-risk AI outputs used in healthcare decision workflows.",
      jurisdiction: "EU",
      status: "OPEN",
      citations: [
        {
          law: "EU AI Act",
          article: "Article 14",
          summary: "Human oversight must be designed so that qualified individuals can understand, supervise, and intervene in system operation when needed."
        }
      ]
    },
    {
      title: "Cross-Border Transfer Review",
      severity: "LOW",
      message: "AI data processing involves cross-border transfers requiring legal review and appropriate safeguards.",
      jurisdiction: "GLOBAL",
      status: "RESOLVED",
      citations: [
        {
          law: "GDPR",
          article: "Chapter V",
          summary: "Transfers of personal data outside the EEA require safeguards such as adequacy decisions, SCCs, or other lawful transfer mechanisms."
        }
      ]
    }
  ];

  for (const a of alerts) {
    await db.run(
      `
      INSERT INTO alerts (title, severity, message, jurisdiction, status, created_at, citations)
      VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
      `,
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

  console.log("✅ Demo alerts seeded with full citations (law + article + summary)");
};
