function tokenizeKeywords(str) {
  return str
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
}

function overlapScore(reqKeywords, controlKeywords) {
  const reqSet = new Set(reqKeywords);
  const ctrlSet = new Set(controlKeywords);
  let overlap = 0;
  for (const k of reqSet) if (ctrlSet.has(k)) overlap++;
  return Math.round((overlap / Math.max(reqSet.size, 1)) * 100);
}

/**
 * Simple coverage model:
 * - find the best matching policy_control by keyword overlap
 * - compute "coverage" = avg(overlapScore, coverage_score)
 * - if coverage < threshold => generate alert
 */
async function runAnalysis(db) {
  const requirements = await db.all(`
    SELECT r.*, l.name as law_name, l.jurisdiction, l.source_url
    FROM requirements r
    JOIN laws l ON l.id = r.law_id
  `);

  const controls = await db.all(`
    SELECT pc.*, p.name as policy_name, p.owner_team
    FROM policy_controls pc
    JOIN policies p ON p.id = pc.policy_id
  `);

  // Clear existing alerts for demo repeatability
  await db.run(`DELETE FROM alerts`);

  const now = new Date().toISOString();

  for (const req of requirements) {
    const reqKeys = tokenizeKeywords(req.keywords);

    let best = null;
    let bestMatch = -1;

    for (const c of controls) {
      const cKeys = tokenizeKeywords(c.keywords);
      const match = overlapScore(reqKeys, cKeys);
      if (match > bestMatch) {
        bestMatch = match;
        best = { ...c, match };
      }
    }

    const claimed = best ? best.coverage_score : 0;
    const coverage = best ? Math.round((best.match + claimed) / 2) : 0;

    // Thresholds: stricter for high severity requirements
    const threshold = req.severity >= 5 ? 75 : req.severity === 4 ? 65 : 55;

    if (coverage < threshold) {
      const riskScore = Math.min(100, (req.severity * 18) + (threshold - coverage));
      const owner = req.recommended_owner;

      const citations = [
        { type: "law", title: req.law_name, url: req.source_url, requirement: req.requirement_code },
        best
          ? { type: "policy_control", title: best.policy_name, control: best.control_code, match: best.match }
          : { type: "policy_control", title: "No matching internal control found", control: "N/A", match: 0 }
      ];

      await db.run(
        `INSERT INTO alerts
          (created_at, alert_type, jurisdiction, title, description, recommended_owner, risk_score, severity, citations, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          now,
          "POLICY_GAP",
          req.jurisdiction,
          `[${req.requirement_code}] Coverage gap for ${req.title}`,
          `Requirement "${req.title}" from ${req.law_name} appears under-covered. Estimated coverage=${coverage}%. Recommended threshold=${threshold}%. Suggested action: review policy controls, add logging/oversight/data minimization as applicable.`,
          owner,
          riskScore,
          req.severity,
          JSON.stringify(citations),
          "OPEN"
        ]
      );
    }
  }

  // HR demo: pay band disclosure scan (mock)
  const payBands = await db.get(`
    SELECT * FROM hr_artifacts WHERE artifact_type='PAY_BANDS' AND region='EU'
  `);

  if (payBands) {
    const bands = JSON.parse(payBands.content);
    const missingPosted = bands.filter(b => b.posted === false);
    if (missingPosted.length > 0) {
      const citations = [
        { type: "law", title: "Pay Transparency Rule (Example Global Policy Driver)", url: "https://example.com/pay-transparency" },
        { type: "artifact", title: payBands.name, region: payBands.region, last_updated: payBands.last_updated }
      ];

      await db.run(
        `INSERT INTO alerts
          (created_at, alert_type, jurisdiction, title, description, recommended_owner, risk_score, severity, citations, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          now,
          "HR_RISK",
          "EU",
          "Potential pay band transparency gap (demo scan)",
          `Detected ${missingPosted.length} EU roles where pay bands are not marked as posted/visible. Recommend HR+Legal review for regional disclosure alignment and documentation updates.`,
          "HR",
          78,
          4,
          JSON.stringify(citations),
          "OPEN"
        ]
      );
    }
  }

  return { ok: true };
}

module.exports = { runAnalysis };
