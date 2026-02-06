import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { getDb } from "./db.js";
import { runAnalysis } from "./analyzer.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   ROOT PAGE
========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================
   GET ALERTS
========================= */
app.get("/api/alerts", async (req, res) => {
  const db = await getDb();

  const alerts = await db.all(`
    SELECT * FROM alerts
    ORDER BY created_at DESC
  `);

  alerts.forEach(a => {
    try {
      a.citations = JSON.parse(a.citations);
    } catch {
      a.citations = [];
    }
  });

  res.json(alerts);
});

/* =========================
   RUN ANALYSIS
========================= */
app.post("/api/analyze", async (req, res) => {
  const db = await getDb();
  await runAnalysis(db);
  res.json({ success: true });
});

/* =========================
   COMPLIANCE BRAIN
========================= */
app.post("/api/ask", async (req, res) => {
  const { question } = req.body;
  const db = await getDb();

  const lowerQ = question.toLowerCase();

  // Pull ALL requirements
  const requirements = await db.all(`
    SELECT r.*, l.name as law_name
    FROM requirements r
    JOIN laws l ON r.law_id = l.id
  `);

  const matches = requirements.filter(r =>
    r.keywords.split(",").some(k =>
      lowerQ.includes(k.trim().toLowerCase())
    )
  );

  if (matches.length === 0) {
    return res.json({
      answer: "No direct regulatory match found.",
      citations: []
    });
  }

  // Build answer
  let answer = "Relevant regulatory guidance:\n\n";

  matches.forEach(m => {
    answer += `• ${m.title} (${m.law_name})\n`;
    answer += `${m.text}\n\n`;
  });

  // Build citations
  const citations = matches.map(m => ({
    law: m.law_name,
    requirement: m.requirement_code
  }));

  /* =========================
     AUTO ALERT CREATION
  ========================= */

  if (matches.some(m => m.severity >= 4)) {
    await db.run(`
      INSERT INTO alerts
      (created_at, alert_type, jurisdiction, title, description,
       recommended_owner, risk_score, severity, citations, status)
      VALUES (datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
    `, [
      "POLICY_GAP",
      "GLOBAL",
      "High Risk Compliance Inquiry",
      question,
      matches[0].recommended_owner,
      80,
      matches[0].severity,
      JSON.stringify(citations)
    ]);
  }

  res.json({ answer, citations });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});
