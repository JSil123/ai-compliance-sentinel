const express = require("express");
const path = require("path");
const { getDb } = require("./db");
const { runAnalysis } = require("./analyzer");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Initialize DB on startup (tables + seed)
(async () => {
  await getDb();
  console.log("📦 Database initialized");
})();

/**
 * Health check
 */
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "AI Compliance Sentinel" });
});

/**
 * Run compliance analysis (button-triggered)
 */
app.post("/api/analyze", async (req, res) => {
  try {
    const db = await getDb();
    await runAnalysis(db);

    res.json({
      ok: true,
      message: "Compliance analysis completed"
    });
  } catch (err) {
    console.error("❌ Analysis failed:", err);
    res.status(500).json({ ok: false, error: "Analysis failed" });
  }
});

/**
 * Fetch alerts
 */
app.get("/api/alerts", async (req, res) => {
  const { status, owner, jurisdiction } = req.query;

  try {
    const db = await getDb();

    const where = [];
    const params = [];

    if (status && status !== "All") {
      where.push("status = ?");
      params.push(status);
    }
    if (owner && owner !== "All") {
      where.push("recommended_owner = ?");
      params.push(owner);
    }
    if (jurisdiction && jurisdiction !== "All") {
      where.push("jurisdiction = ?");
      params.push(jurisdiction);
    }

    const sql = `
      SELECT *
      FROM alerts
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY created_at DESC
    `;

    const rows = await db.all(sql, params);

    res.json(
      rows.map(alert => ({
        id: alert.id,
        created_at: alert.created_at,
        owner: alert.recommended_owner,
        jurisdiction: alert.jurisdiction,
        severity: alert.severity,
        risk: alert.severity,
        status: alert.status,
        title: alert.type || "Regulatory Alert",
        description: alert.message,
        citations: alert.citations ? JSON.parse(alert.citations) : []
      }))
    );
  } catch (err) {
    console.error("❌ Failed to fetch alerts:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch alerts" });
  }
});

/**
 * Ask the Compliance Brain
 */
app.post("/api/ask", async (req, res) => {
  const { question } = req.body || {};

  if (!question) {
    return res.status(400).json({ ok: false, error: "Question required" });
  }

  try {
    const q = question.toLowerCase();
    const db = await getDb();

    const requirements = await db.all(`
      SELECT r.requirement_code, r.title, r.keywords,
             l.name AS law_name, l.jurisdiction, l.source_url
      FROM requirements r
      JOIN laws l ON l.id = r.law_id
    `);

    const policies = await db.all(`
      SELECT p.name AS policy_name, p.version,
             pc.control_code, pc.keywords
      FROM policy_controls pc
      JOIN policies p ON p.id = pc.policy_id
    `);

    const score = keywords =>
      keywords
        ?.split(",")
        .filter(k => q.includes(k.trim().toLowerCase())).length || 0;

    const citations = [];

    requirements
      .filter(r => score(r.keywords))
      .slice(0, 2)
      .forEach(r =>
        citations.push({
          type: "law",
          title: r.law_name,
          requirement: r.requirement_code,
          jurisdiction: r.jurisdiction,
          url: r.source_url
        })
      );

    policies
      .filter(p => score(p.keywords))
      .slice(0, 2)
      .forEach(p =>
        citations.push({
          type: "policy",
          title: p.policy_name,
          control: p.control_code,
          version: p.version
        })
      );

    res.json({
      ok: true,
      answer:
        "Advisory (human review required): This question involves regulated data usage. Review applicable laws and internal controls.",
      citations
    });
  } catch (err) {
    console.error("Ask failed:", err);
    res.status(500).json({ ok: false, error: "Ask failed" });
  }
});

/**
 * Start server
 */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ AI Compliance Sentinel running on port ${PORT}`);
});
