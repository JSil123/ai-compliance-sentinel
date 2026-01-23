const express = require("express");
const path = require("path");
const { getDb } = require("./db");
const { runAnalysis } = require("./analyzer");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/**
 * Initialize DB ONCE (Render-safe)
 */
(async () => {
  try {
    await getDb();
    console.log("✅ Database initialized");
  } catch (err) {
    console.error("❌ DB init failed:", err);
  }
})();

/**
 * Health
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
    console.error("❌ Analysis failed:", err);
    res.status(500).json({ ok: false });
  }
});

/**
 * Fetch alerts
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
        ...a,
        title: a.type || "Regulatory Alert",
        risk: a.severity,
        description: a.message,
        citations: a.citations ? JSON.parse(a.citations) : []
      }))
    );
  } catch (err) {
    console.error("❌ Alerts fetch failed:", err);
    res.status(500).json([]);
  }
});

/**
 * Ask Compliance Brain
 */
app.post("/api/ask", async (req, res) => {
  const { question } = req.body || {};
  if (!question) return res.status(400).json({ ok: false });

  try {
    const db = await getDb();
    const reqs = await db.all(`
      SELECT r.requirement_code, r.title, l.name AS law
      FROM requirements r
      JOIN laws l ON l.id = r.law_id
    `);

    let answer = "Advisory (human review required):\n\n";
    reqs.forEach(r => {
      answer += `• ${r.requirement_code} – ${r.title} (${r.law})\n`;
    });

    res.json({ ok: true, answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

/**
 * Start server
 */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`AI Compliance Sentinel running on port ${PORT}`);
});
