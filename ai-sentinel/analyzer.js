async function runAnalysis(db) {
  console.log("🔍 Running compliance analysis...");

  // Clear previous alerts (demo behavior)
  await db.run(`DELETE FROM alerts`);

  // Insert mock alerts
 async function runAnalysis(db) {
  console.log("🔍 Running compliance analysis...");

  await db.run(`DELETE FROM alerts`);

  await db.run(`
    INSERT INTO alerts (
      type,
      severity,
      title,
      risk,
      message,
      source,
      status,
      recommended_owner,
      jurisdiction,
      citations
    ) VALUES (
      'AI_GOVERNANCE',
      'HIGH',
      'Human Oversight Required',
      'High Risk AI Deployment',
      'High-risk AI systems must include documented human oversight before deployment.',
      'EU AI Act',
      'OPEN',
      'Legal',
      'EU',
      ?
    )
  `, [JSON.stringify([
    { law: "EU AI Act", article: "Article 14", url: "https://example.com/eu-ai-act" }
  ])]);

  await db.run(`
    INSERT INTO alerts (
      type,
      severity,
      title,
      risk,
      message,
      source,
      status,
      recommended_owner,
      jurisdiction,
      citations
    ) VALUES (
      'DATA_PRIVACY',
      'MEDIUM',
      'PHI Usage in AI Training',
      'Healthcare Data Exposure',
      'Use of PHI in AI training requires approved environments and access controls.',
      'HIPAA',
      'OPEN',
      'Security',
      'US',
      ?
    )
  `, [JSON.stringify([
    { law: "HIPAA", section: "164.308", url: "https://example.com/hipaa" }
  ])]);

  console.log("✅ Alerts generated.");
}

module.exports = { runAnalysis };
