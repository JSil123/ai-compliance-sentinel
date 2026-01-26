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
    const rows = await db.all(`
      SELECT *
      FROM alerts
      ORDER BY created_at DESC
    `);

    res.json(rows.map(a => ({
      id: a.id,
      title: a.type,
      severity: a.severity,
      risk: a.severity,
      description: a.message,
      jurisdiction: a.jurisdiction,
      status: a.status,
      owner: "Legal",
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
  const q = (req.body.question || "").toLowerCase();

  let answer = "No direct regulatory conflict detected.";
  let citations = [];

  if (q.includes("phi") || q.includes("health")) {
    answer =
      "Use of PHI for AI training is permitted only under strict safeguards. GDPR and the EU AI Act require data minimization, explicit legal basis, and documented human oversight.";
    citations = [
      { law: "GDPR", article: "Article 9" },
      { law: "EU AI Act", article: "Article 14" }
    ];
  } else if (q.includes("employee") || q.includes("hr")) {
    answer =
      "AI use involving employee data requires transparency, purpose limitation, and documented impact assessments.";
    citations = [
      { law: "GDPR", article: "Article 35" }
    ];
  } else if (q.includes("biometric")) {
    answer =
      "Biometric AI systems are classified as high-risk and may be prohibited depending on jurisdiction.";
    citations = [
      { law: "EU AI Act", article: "Article 5" }
    ];
  }

  res.json({ ok: true, answer, citations });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`✅ AI Compliance Sentinel running on ${PORT}`)
);


