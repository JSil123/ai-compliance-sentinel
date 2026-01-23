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
  try {
    const db = await getDb();
    await runAnalysis(db);
    console.log("✅ Demo alerts seeded");
  } catch (e) {
    console.error("Startup error:", e);
  }
})();

/**
 * Health check
 */
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

/**
 * Run Compliance Analysis
 */
app.post("/api/analyze", async (req, res) => {
  try {
    const db = await getDb();
    await runAnalysis(db);
    res.json({ ok: true, message: "Analysis completed" });
  } catch (err) {
    console.error("Analyze error:", err);
    res.status(500).json({ ok: false });
  }
});

/**
 * List Alerts
 */
app.get("/api/alerts", async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(
      `SELECT * FROM alerts ORDER BY created_at DESC`
    );

    res.json(rows.map(a => ({
      title: a.type,
      owner: a.recommended_owner || "Legal",
      jurisdiction: a.jurisdiction,
      severity: a.severity,
      risk: a.severity,
      status: a.status || "OPEN",
      description: a.message,
      citations: a.citations ? JSON.parse(a.citations) : []
    })));
  } catch (err) {
    console.error("Alert fetch error:", err);
    res.status(500).json([]);
  }
});

/**
 * Ask the Compliance Brain
 */
app.post("/api/ask", async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ answer: "No question provided." });
  }

  res.json({
    answer:
      "Use of PHI for AI training is permitted only under strict safeguards. GDPR and the EU AI Act require data minimization, explicit legal basis, and documented human oversight.",
    citations: [
      { law: "EU AI Act", article: "Article 14" },
      { law: "GDPR", article: "Article 9" }
    ]
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`✅ AI Compliance Sentinel running on ${PORT}`)
);
