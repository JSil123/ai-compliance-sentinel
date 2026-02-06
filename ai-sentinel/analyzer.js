export async function runAnalysis(db) {

  await db.exec(`DELETE FROM alerts`);

  await db.run(`
    INSERT INTO alerts (
      created_at,
      alert_type,
      jurisdiction,
      title,
      description,
      recommended_owner,
      risk_score,
      severity,
      citations,
      status
    )
    VALUES (
      datetime('now'),
      'LAW_CHANGE',
      'EU',
      'Human Oversight Missing',
      'High-risk AI decisions lack documented human review.',
      'Legal',
      90,
      5,
      ?,
      'OPEN'
    )
  `, [
    JSON.stringify([{ law: "EU AI Act", article: "Human Oversight" }])
  ]);

  console.log("Demo analysis created alerts");
}
