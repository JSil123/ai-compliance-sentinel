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

/* ROOT */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* GET ALERTS */
app.get("/api/alerts", async (req, res) => {
  const db = await getDb();
  const alerts = await db.all(`
    SELECT * FROM alerts ORDER BY created_at DESC
  `);

  alerts.forEach(a => {
    a.citations = JSON.parse(a.citations || "[]");
  });

  res.json(alerts);
});

/* RUN ANALYSIS */
app.post("/api/analyze", async (req, res) => {
  const db = await getDb();
  await runAnalysis(db);
  res.json({ success: true });
});

/* ASK THE COMPLIANCE BRAIN */
app.post("/api/ask", async (req, res) => {
  const { question } = req.body;
  const db = await getDb();
  const q = question.toLowerCase();

  const requirements = await db.all(`
    SELECT r.*, l.name AS law
    FROM requirements r
    JOIN laws l ON r.law_id = l.id
  `);

  const matches = requirements.filter(r =>
    r.keywords.split(",").some(k =>
      q.includes(k.trim().toLowerCase())
    )
  );

  if (!matches.length) {
    return res.json({
      answer: "No direct regulatory guidance found for this scenario.",
      citations: []
    });
  }

  let answer = `Based on applicable regulations:\n\n`;
  matches.forEach(m => {
    answer += `• ${m.title} (${m.law})\n${m.text}\n\n`;
  });

  const citations = matches.map(m => ({
    law: m.law,
    requirement: m.requirement_code
  }));

  // AUTO ALERT
  if (matches.some(m => m.severity >= 4)) {
    await db.run(`
      INSERT INTO alerts
      (created_at, alert_type, jurisdiction, title, description,
       recommended_owner, risk_score, severity, citations, status)
      VALUES (datetime('now'), 'COMPLIANCE_QUERY', 'GLOBAL', ?, ?, ?, 80, ?, ?, 'OPEN')
    `, [
      "High-Risk Compliance Question",
      question,
      matches[0].recommended_owner,
      matches[0].severity,
      JSON.stringify(citations)
    ]);
  }

  res.json({ answer, citations });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Running on port ${PORT}`));
