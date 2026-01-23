/**
 * analyzer.js
 * Generates mock compliance alerts
 */

async function runAnalysis(db) {
  // Clear old alerts
  await db.exec(`DELETE FROM alerts`);

  const now = new Date().toISOString();

  const alerts = [
    {
      title: "New Regulation Detected: EU AI Act Update",
      type: "Regulatory Change",
      description:
        "A newly enacted regulatory requirement has been identified. Immediate legal review is required to assess applicability, enforcement timelines, and operational impact.",
      severity: "HIGH",
      risk: "Regulatory Non-Compliance",
      status: "OPEN",
      jurisdiction: "EU",
      recommended_owner: "Legal",
      citations: JSON.stringify([
        {
          law: "EU AI Act",
          article: "Article 14",
          url: "https://example.com/eu-ai-act"
        }
      ])
    },
    {
      title: "AI Training Data Governance Gap",
      type: "Policy Gap",
      description:
        "Current AI model training practices may involve regulated personal data without sufficient documented oversight, approval, or audit controls.",
      severity: "MEDIUM",
      risk: "Data Protection",
      status: "OPEN",
      jurisdiction: "US",
      recommended_owner: "Security",
      citations: JSON.stringify([
        {
          law: "HIPAA",
          article: "§164.308",
          url: "https://example.com/hipaa"
        }
      ])
    }
  ];

  for (const a of alerts) {
    await db.run(
      `
      INSERT INTO alerts (
        title,
        type,
        description,
        severity,
        risk,
        status,
        jurisdiction,
        recommended_owner,
        citations,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        a.title,
        a.type,
        a.description,
        a.severity,
        a.risk,
        a.status,
        a.jurisdiction,
        a.recommended_owner,
        a.citations,
        now
      ]
    );
  }
}

module.exports = { runAnalysis };
