async function runAnalysis(db) {
  console.log("🔍 Running compliance analysis...");

  // Clear previous alerts (demo behavior)
  await db.run(`DELETE FROM alerts`);

  // Insert mock alerts
  await db.run(`
    INSERT INTO alerts (
      type,
      severity,
      message,
      source,
      status,
      recommended_owner,
      jurisdiction,
      citations
    ) VALUES (
      'AI_GOVERNANCE',
      'HIGH',
      'High-risk AI system requires documented human oversight before deployment.',
      'EU AI Act',
      'OPEN',
      'Legal',
      'EU',
      ?
    )
  `, [JSON.stringify([
    {
      law: "EU AI Act",
      article: "Article 14",
      url: "https://example.com/eu-ai-act"
    }
  ])]);

  await db.run(`
    INSERT INTO alerts (
      type,
      severity,
      message,
      source,
      status,
      recommended_owner,
      jurisdiction,
      citations
    ) VALUES (
      'DATA_PRIVACY',
      'MEDIUM',
      'Use of PHI in AI training requires validation of approved environments and access controls.',
      'HIPAA',
      'OPEN',
      'Security',
      'US',
      ?
    )
  `, [JSON.stringify([
    {
      law: "HIPAA",
      section: "164.308",
      url: "https://example.com/hipaa"
    }
  ])]);

  console.log("✅ Compliance analysis completed. Alerts generated.");
}

module.exports = { runAnalysis };
