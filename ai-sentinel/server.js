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
  console.log("✅ Demo alerts loaded");
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
    res.json({ ok: true, message: "Analysis completed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

/**
 * Alerts API
 */
app.get("/api/alerts", async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(`
      SELECT * FROM alerts
      ORDER BY created_at DESC
    `);

    res.json(
      rows.map(a => ({
        title: a.type,
        risk: a.severity,
        description: a.message,
        jurisdiction: a.jurisdiction,
        citations: a.citations ? JSON.parse(a.citations) : []
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});


  res.json(
    rows.map(a => ({
      created: a.created_at,
      owner: a.recommended_owner || "Legal",
      jurisdiction: a.jurisdiction,
      severity: a.severity,
      risk: a.severity,
      title: a.type,
      status: "OPEN",
      description: a.message,
      citations: a.citations ? JSON.parse(a.citations) : []
    }))
  );
});

/**
 * Ask the Compliance Brain (FAKE AI DEMO)
 */
app.post("/api/ask", async (req, res) => {
  const { question } = req.body || {};

  if (!question) {
    return res.json({
      ok: true,
      answer: "Please enter a compliance-related question.",
      citations: []
    });
  }

  const q = question.toLowerCase();

  // 🔥 Demo logic (deterministic & reliable)
  if (q.includes("phi") || q.includes("healthcare")) {
    return res.json({
      ok: true,
      answer:
        "Use of PHI for AI training is permitted only under strict safeguards. GDPR and the EU AI Act require data minimization, explicit legal basis, and documented human oversight.",
      citations: [
        { law: "GDPR", article: "Article 9" },
        { law: "EU AI Act", article: "Article 14" }
      ]
    });
  }

  if (q.includes("employee") || q.includes("hr")) {
    return res.json({
      ok: true,
      answer:
        "AI systems processing employee data must be transparent, auditable, and avoid automated decision-making without human review.",
      citations: [
        { law: "EU AI Act", article: "Article 22" }
      ]
    });
  }

  // 🔴 THIS is where your snippet belongs
  return res.json({
    ok: true,
    answer:
      "No direct regulatory conflicts detected. However, a human compliance review is recommended.",
    citations: []
  });
});

/**
 * Start server
 */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`✅ AI Compliance Sentinel running on port ${PORT}`)
);

