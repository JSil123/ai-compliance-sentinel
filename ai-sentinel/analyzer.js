// analyzer.js (ES Module)
export async function runAnalysis(db) {
  // Clear old alerts (demo-friendly)
  await db.exec(`DELETE FROM alerts`);

  // Pull high-risk regulatory requirements
  const requirements = await db.all(`
    SELECT
      r.id,
      r.requirement_code,
      r.title AS requirement_title,
      r.text AS requirement_text,
      r.severity,
      r.recommended_owner,
      l.name AS law_name,
      l.jurisdiction,
      l.effective_date,
      l.source_url
    FROM requirements r
    JOIN laws l ON r.law_id = l.id
    WHERE r.severity >= 4
  `);

  for (const r of requirements) {
    const alert = {
      created_at: new Date().toISOString(),
      alert_type: "REGULATORY_RISK",
      jurisdiction: r.jurisdiction,
      title: `Compliance risk: ${r.requirement_title}`,
      description: `The requirement "${r.requirement_title}" under ${r.law_name} may not be fully addressed by current controls.`,
      recommended_owner: r.recommended_owner,
      risk_score: r.severity * 20,
      severity: r.severity,
      citations: JSON.stringify([
        {
          law: r.law_name,
          jurisdiction: r.jurisdiction,
          effective_date: r.effective_date,
          requirement_code: r.requirement_code,
          source_url: r.source_url
        }
      ]),
      status: "OPEN"
    };

    await db.run(
      `
      INSERT INTO alerts
      (created_at, alert_type, jurisdiction, title, description,
       recommended_owner, risk_score, severity, citations, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      Object.values(alert)
    );
  }

  console.log("✅ Compliance analysis completed using regulatory database");
}
