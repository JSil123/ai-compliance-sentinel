async function runAnalysis(db) {
  // Clear existing alerts (demo behavior)
  await db.exec(`DELETE FROM alerts`);

  const now = new Date().toISOString();

  const alerts = [
    {
      type: "REGULATORY",
      severity: "HIGH",
      message:
        "New high-risk AI obligations detected under the EU AI Act. Human oversight controls must be verified.",
      source: "EU AI Act – Article 14",
      status: "OPEN",
      recommended_owner: "Legal",
      jurisdiction: "EU",
      citations: JSON.stringify([
        {
          law: "EU AI Act",
          article: "Article 14",
          url: "https://example.com/eu-ai-act"
        }
      ])
    },
    {
      type: "DATA_GOVERNANCE",
      severity: "MEDIUM",
      message:
        "Use of patient data for AI training requires validation of consent and data minimization controls.",
      source: "Internal Policy Review",
      status: "OPEN",
      recommended_owner: "Security",
      jurisdiction: "US",
      citations: JSON.stringify([
        {
          policy: "AI Governance Policy",
          control: "AI-GOV-01"
        }
      ])
    }
  ];

  for (const a of alerts) {
    await db.run(
      `
      INSERT INTO alerts (
        type,
        severity,
        message,
        source,
        status,
        recommended_owner,
        jurisdiction,
        citations,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        a.type,
        a.severity,
        a.message,
        a.source,
        a.status,
        a.recommended_owner,
        a.jurisdiction,
        a.citations,
        now
      ]
    );
  }
}

module.exports = { runAnalysis };
