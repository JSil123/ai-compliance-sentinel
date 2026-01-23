const express = require("express");
const path = require("path");
const { getDb } = require("./db");
const { runAnalysis } = require("./analyzer");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/**
 * Initialize DB + seed demo alerts
 */
(async () => {
  const db = await getDb();
  await runAnalysis(db);
  console.log("✅ Demo database initialized");
})();

/**
 * Health check
 */
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

/**
 * Run Compliance Analysis (re-seeds alerts)
 */
app.post("/api/analyze", async (req, res) => {
  try {
    const db = await getDb();
    await runAnalysis(db);
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Analysis failed", err);
    res.status(500).json({ ok: false });
  }
});

/**
 * List alerts (feeds UI)
 */
app.get("/api/alerts", async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(`
      SELECT *
      FROM alerts
      ORDER BY created_at DESC
    `);

    res.json(
      rows.map(a => ({
        created: a.created_at,
        owner: a.recommended_owner,
        jurisdiction: a.jurisdiction,
        severity: a.severity,
        risk: a.severity,
        title: a.type,
        status: a.status || "OPEN",
        description: a.message,
        citations: a.citations ? JSON.parse(a.citations) : []
      }))
    );
  } catch (err) {
    console.error("❌ Failed to fetch alerts", err);
    res.status(500).json([]);
  }
});

/**
 * Ask the Compliance Brain (mock AI)
 */
app.post("/api/ask", async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ ok: false });
  }

  const q = question.toLowerCase();

  let answer =
    "No direct regulatory conflicts detected. A human compliance review is recommended.";

  if (q.includes("phi") || q.includes("patient")) {
    answer =
      "Use of PHI for AI training is permitted only under strict safeguards. GDPR and the EU AI Act require data minimization, explicit legal basis, and documented human oversight.";
  }

  if (q.includes("eu") && q.includes("ai")) {
    answer =
      "AI systems used in the EU must comply with the EU AI Act, including risk classification, transparency obligations, and human oversight requirements.";
  }

  res.json({
    ok: true,
    answer,
    citations: [
      {
        law: "EU AI Act",
        article: "Article 14",
        note: "Human oversight required"
      }
    ]
  });
});

/**
 * Start server
 */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ AI Compliance Sentinel running on port ${PORT}`);
});
