// analyzer.js
export async function runAnalysis(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT,
      alert_type TEXT,
      jurisdiction TEXT,
      title TEXT,
      description TEXT,
      recommended_owner TEXT,
      risk_score INTEGER,
      severity INTEGER,
      citations TEXT,
      status TEXT
    );
  `);

  await db.exec(`DELETE FROM alerts`);

  const demoAlerts = [
    {
      alert_type: "LAW_CHANGE",
      jurisdiction: "EU",
      title: "EU AI Act – Human Oversight Required",
      description:
        "High-risk AI systems must include documented human oversight procedures.",
      recommended_owner: "Legal",
      risk_score: 85,
      severity: 5,
      citations: [{ law: "EU AI Act", article: "Article 14" }],
      status: "OPEN"
    },
    {
      alert_type: "DATA_RISK",
      jurisdiction: "US",
      title: "HIPAA Audit Logging Gap",
      description:
        "Healthcare AI systems lack sufficient audit logging controls.",
      recommended_owner: "Security",
      risk_score: 70,
      severity: 4,
      citations: [{ law: "HIPAA", article: "164.312(b)" }],
      status: "OPEN"
    }
  ];

  for (const a of demoAlerts) {
    await db.run(`
      INSERT INTO alerts
      (created_at, alert_type, jurisdiction, title, description,
       recommended_owner, risk_score, severity, citations, status)
      VALUES (datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      a.alert_type,
      a.jurisdiction,
      a.title,
      a.description,
      a.recommended_owner,
      a.risk_score,
      a.severity,
      JSON.stringify(a.citations),
      a.status
    ]);
  }

  console.log("✅ Compliance analysis complete");
}
