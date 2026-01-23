const express = require("express");
const path = require("path");
const { getDb } = require("./db");
const { runAnalysis } = require("./analyzer");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./compliance.db");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Health
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Run analysis (generate alerts)
app.post("/api/analyze", async (req, res) => {
  const db = await getDb();
  await runAnalysis(db);
  await db.close();
  res.json({ ok: true, message: "Analysis complete. Alerts refreshed." });
});

// List alerts
app.get("/api/alerts", async (req, res) => {
  const { status, owner, jurisdiction } = req.query;

  const db = await getDb();
  const where = [];
  const params = [];

  if (status) { where.push("status=?"); params.push(status); }
  if (owner) { where.push("recommended_owner=?"); params.push(owner); }
  if (jurisdiction) { where.push("jurisdiction=?"); params.push(jurisdiction); }

  const sql = `
    SELECT * FROM alerts
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY created_at DESC
  `;

  const rows = await db.all(sql, params);
  await db.close();
  res.json(rows.map(r => ({ ...r, citations: JSON.parse(r.citations) })));
});

// "Ask the compliance brain" (simple DB-grounded answer with citations)
app.post("/api/ask", async (req, res) => {
  const { question } = req.body || {};
  if (!question || typeof question !== "string") {
    return res.status(400).json({ ok: false, error: "Question is required." });
  }

  const q = question.toLowerCase();
  const db = await getDb();

  // Naive retrieval: match keywords in requirements + policy_controls
  const reqs = await db.all(`
    SELECT r.requirement_code, r.title, r.text, r.keywords,
           l.name as law_name, l.jurisdiction, l.source_url
    FROM requirements r
    JOIN laws l ON l.id = r.law_id
  `);

  const policies = await db.all(`
    SELECT p.name as policy_name, p.policy_area, p.jurisdiction_scope, p.version,
           pc.control_code, pc.title as control_title, pc.text as control_text, pc.keywords
    FROM policy_controls pc
    JOIN policies p ON p.id = pc.policy_id
  `);

  function scoreRow(keywords) {
    const keys = keywords.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    let score = 0;
    for (const k of keys) if (q.includes(k)) score += 2;
    return score;
  }

  const rankedReqs = reqs
    .map(r => ({ ...r, score: scoreRow(r.keywords) }))
    .sort((a,b) => b.score - a.score)
    .slice(0, 3);

  const rankedPolicies = policies
    .map(p => ({ ...p, score: scoreRow(p.keywords) }))
    .sort((a,b) => b.score - a.score)
    .slice(0, 3);

  await db.close();

  // Construct an "advisory only" answer
  const citations = [];

  let answer = `Advisory (human review required): Based on your question, here are the most relevant requirements and internal controls.\n\n`;

  answer += `Relevant external requirements:\n`;
  for (const r of rankedReqs.filter(x => x.score > 0)) {
    citations.push({ type: "law", title: r.law_name, jurisdiction: r.jurisdiction, url: r.source_url, requirement: r.requirement_code });
    answer += `• [${r.requirement_code}] ${r.title} (${r.law_name}, ${r.jurisdiction}): ${r.text}\n`;
  }

  answer += `\nRelevant internal policy controls:\n`;
  for (const p of rankedPolicies.filter(x => x.score > 0)) {
    citations.push({ type: "policy", title: p.policy_name, control: p.control_code, version: p.version });
    answer += `• ${p.policy_name} (${p.control_code}): ${p.control_text}\n`;
  }

  if (citations.length === 0) {
    answer = `Advisory (human review required): I could not find a strong match in the current mock knowledge base. In a production version, this would trigger a compliance escalation workflow to HR/Legal/Security for review.`;
  } else {
    answer += `\nSuggested next steps:\n`;
    answer += `• Confirm jurisdiction (EU/US/Global) and data type (PHI/PII/Confidential).\n`;
    answer += `• If high-stakes healthcare decisions are involved, ensure human oversight, logging/traceability, and access controls.\n`;
    answer += `• If restricted data is used with AI tools, validate approved environments and DLP requirements.\n`;
  }

  res.json({ ok: true, answer, citations });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ AI Compliance Sentinel running at http://localhost:${PORT}`);
  console.log(`   Seed DB: npm run seed`);
  console.log(`   Run analysis: POST /api/analyze (button in UI)`);
});

