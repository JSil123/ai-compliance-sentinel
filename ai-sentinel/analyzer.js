async function runAnalysis(db) {
  console.log("🔍 Running compliance analysis...");

  // Clear old alerts
  await db.run("DELETE FROM alerts");

  const alerts = [
    {
      type: "Regulatory Risk",
      severity: "HIGH",
      message:
        "New regulatory obligations identified under the EU AI Act requiring documented human oversight for high-risk AI systems.",
      source: "EU AI Act",
      status: "OPEN",
      recommended_owner: "Legal",
      jurisdiction: "EU",
      citations: JSON.stringify([
        {
          law: "EU AI Act",
          article: "Article 14",
          url: "https://example.com/eu-ai-act"
        }
      ]),
      title: "New Regulation Detected: EU AI Act Oversight Requirements"
    },
    {
      type: "Security Control Gap",
      severity: "MEDIUM",
      message:
        "AI system training data handling procedures may not meet internal governance and security review standards.",
      source: "Internal Policy",
      status: "OPEN",
      recommended_owner: "Security",
      jurisdiction: "US",
      citations: JSON.stringify([
        {
          policy: "AI Governance Policy",
          control: "AI-GOV-01"
        }
      ]),
      title: "AI Training Data Governance Review Required"
    }
  ];

  for (const a of alerts) {
    await db.run(
      `
      INSERT INTO alerts
      (type, severity, message, source, status, recommended_owner, jurisdiction, citations, title)
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
        a.title
      ]
    );
  }

  console.log(`✅ ${alerts.length} compliance alerts generated`);
}

module.exports = { runAnalysis };
