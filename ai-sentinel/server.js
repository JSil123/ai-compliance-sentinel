const express = require("express");
const path = require("path");
const { getDb } = require("./db");
const { runAnalysis } = require("./analyzer");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/**
 * Initialize DB on startup (Render-safe)
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
 * List alerts (THIS feeds your UI)
 */
app.get("/api/alerts", async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(`SELECT * FROM alerts ORDER BY created_at DESC`);

    res.json(rows.map(a => ({
      title: a.type,
      risk: a.severity,
      description: a.message,
      jurisdiction: a.jurisdiction,
      citations: a.citations ? JSON.parse(a.citations) : []
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
