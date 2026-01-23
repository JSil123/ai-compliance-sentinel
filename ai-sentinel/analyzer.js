async function runAnalysis(db) {
  await db.run(`DELETE FROM alerts`);

  await db.run(`
    INSERT INTO alerts
      (type, severity, message, recommended_owner, jurisdiction, citations)
    VALUES
      (
        'New Regulation Detected',
        'HIGH',
        'EU AI Act enforcement date updated. Review AI systems for compliance.',
        'Legal',
        'EU',
        ?
      )
  `, [
    JSON.stringify([
      {
        law: "EU AI Act",
        article: "Article 14",
        url: "https://example.com/eu-ai-act"
      }
    ])
  ]);

  await db.run(`
    INSERT INTO alerts
      (type, severity, message, recommended_owner, jurisdiction)
    VALUES
      (
        'AI Data Usage Review',
        'MEDIUM',
        'Patient data used in model training requires governance approval.',
        'Security',
        'US'
      )
  `);
}

module.exports = { runAnalysis };
