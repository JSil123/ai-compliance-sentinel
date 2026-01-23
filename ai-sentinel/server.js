const express = require("express");
const path = require("path");
const { getDb } = require("./db");
const { runAnalysis } = require("./analyzer");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/**
 * Initialize DB on startup
 */
(async () => {
  const db = await getDb();
  await runAnalysis(db);
  console.log("✅ Database initialized with demo alerts");
})();

/**
 * Health check
 */
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

/**
 * Run compliance analysis
 */
app.post("/api/analyze", async (req, res) => {
  try {
    const db = await getDb();
    await runAnalysis(db);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

/**
 * List alerts
 */
app.get("/api/alerts", async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(`
      SELECT *
      FROM alerts
      ORDER BY created_at DESC
    `);

    res.json(rows.map(a => ({
      title: a.type || "Regulatory Alert",
      risk: a.severity || "Medium",
      description: a.message,
      jurisdiction: a.jurisdiction,
      owner: a.recommended_owner || "Legal",
      status: a.status || "OPEN",
      created_at: a.created_at,
      citations: a.citations ? JSON.parse(a.citations) : []
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

/**
 * Ask the Compliance Brain
 */
app.post("/api/ask", async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ ok: false, error: "Question required" });
  }

  const q = question.toLowerCase();
  const db = await getDb();

  const requirements = await db.all(`
    SELECT r.requirement_code, r.title, r.keywords,
           l.name AS law_name, l.jurisdiction
    FROM requirements r
    JOIN laws l ON l.id = r.law_id
  `);

  const policies = await db.all(`
    SELECT p.name AS policy_name, pc.control_code, pc.keywords
    FROM policy_controls pc
    JOIN policies p ON p.id = pc.policy_id
  `);

  const score = (keywords = "") =>
    keywords
      .split(",")
      .map(k => k.trim().toLowerCase())
      .filter(k => q.includes(k)).length;

  const rankedReqs = requirements
    .map(r => ({ ...r, score: score(r.keywords) }))
    .filter(r => r.score > 0);

  const rankedPolicies = policies
    .map(p => ({ ...p, score: score(p.keywords) }))
    .filter(p => p.score > 0);

  // 👇 THIS IS WHERE YOUR CODE GOES
  if (!rankedReqs.length && !rankedPolicies.length) {
    return res.json({
      ok: true,
      answer:
        "No direct regulatory conflicts detected. However, a human compliance review is recommended.",
      citations: []
    });
  }

  let answer =
    "Advisory (human review required): The following obligations may apply:\n\n";

  const citations = [];

  rankedReqs.forEach(r => {
    answer += `• ${r.law_name} – ${r.title}\n`;
    citations.push({
      law: r.law_name,
      jurisdiction: r.jurisdiction,
      requirement: r.requirement_code
    });
  });

  rankedPolicies.forEach(p => {
    answer += `• Internal Policy: ${p.policy_name} (${p.control_code})\n`;
  });

  res.json({ ok: true, answer, citations });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
