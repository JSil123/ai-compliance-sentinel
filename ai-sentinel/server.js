const { getDb } = require("./db");

// Force DB init on startup (important for Render)
(async () => {
  await getDb();
})();

const express = require("express");
const path = require("path");
const { getDb } = require("./db");
const { runAnalysis } = require("./analyzer");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/**
 * Health check
 */
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "AI Compliance Sentinel" });
});

/**
 * Run compliance analysis
 * Generates alerts based on mock laws + policies
 */
app.post("/api/analyze", async (req, res) => {
  try {
    const db = await getDb();
    await runAnalysis(db);
    await db.close();

    res.json({
      ok: true,
      message: "Analysis complete. Compliance alerts refreshed."
    });
  } catch (err) {
    console.error("❌ Analysis failed:", err);
    res.status(500).json({
      ok: false,
      error: "Compliance analysis failed"
    });
  }
});

/**
 * List compliance alerts
 */
app.get("/api/alerts", async (req, res) => {
  const { status, owner, jurisdiction } = req.query;

  try {
    const db = await getDb();

    const where = [];
    const params = [];

    if (status) {
      where.push("status = ?");
      params.push(status);
    }
    if (owner) {
      where.push("recommended_owner = ?");
      params.push(owner);
    }
    if (jurisdiction) {
      where.push("jurisdiction = ?");
      params.push(jurisdiction);
    }

    const sql = `
      SELECT *
      FROM alerts
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY created_at DESC
    `;

    const rows = await db.all(sql, params);
    await db.close();

    res.json(
      rows.map(r => ({
        ...r,
        citations: r.citations ? JSON.parse(r.citations) : []
      }))
    );
  } catch (err) {
    console.error("❌ Failed to fetch alerts:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch alerts" });
  }
});

/**
 * Ask the Compliance Brain
 * Advisory-only, citation-backed guidance
 */
app.post("/api/ask", async (req, res) => {
  const { question } = req.body || {};

  if (!question || typeof question !== "string") {
    return res.status(400).json({
      ok: false,
      error: "Question is required"
    });
  }

  try {
    const q = question.toLowerCase();
    const db = await getDb();

    const requirements = await db.all(`
      SELECT r.requirement_code, r.title, r.text, r.keywords,
             l.name AS law_name, l.jurisdiction, l.source_url
      FROM requirements r
      JOIN laws l ON l.id = r.law_id
    `);

    const policies = await db.all(`
      SELECT p.name AS policy_name, p.version,
             pc.control_code, pc.title AS control_title,
             pc.text AS control_text, pc.keywords
      FROM policy_controls pc
      JOIN policies p ON p.id = pc.policy_id
    `);

    await db.close();

    const score = (keywords = "") =>
      keywords
        .split(",")
        .map(k => k.trim().toLowerCase())
        .filter(k => k && q.includes(k))
        .length * 2;

    const rankedReqs = requirements
      .map(r => ({ ...r, score: score(r.keywords) }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const rankedPolicies = policies
      .map(p => ({ ...p, score: score(p.keywords) }))
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    let answer =
      "Advisory (human review required): Based on your question, the following requirements and internal controls are most relevant.\n\n";

    const citations = [];

    if (rankedReqs.length) {
      answer += "Relevant external requirements:\n";
      rankedReqs.forEach(r => {
        citations.push({
          type: "law",
          title: r.law_name,
          jurisdiction: r.jurisdiction,
          requirement: r.requirement_code,
          url: r.source_url
        });
        answer += `• [${r.requirement_code}] ${r.title} (${r.law_name}, ${r.jurisdiction})\n`;
      });
    }

    if (rankedPolicies.length) {
      answer += "\nRelevant internal policy controls:\n";
      rankedPolicies.forEach(p => {
        citations.push({
          type: "policy",
          title: p.policy_name,
          control: p.control_code,
          version: p.version
        });
        answer += `• ${p.policy_name} (${p.control_code})\n`;
      });
    }

    if (!citations.length) {
      answer =
        "Advisory (human review required): No strong match was found in the current mock knowledge base. In production, this would trigger a compliance escalation workflow.";
    } else {
      answer +=
        "\nSuggested next steps:\n" +
        "• Confirm jurisdiction and data classification.\n" +
        "• Ensure human oversight and logging for high-risk AI use.\n" +
        "• Validate approved environments and data protection controls.\n";
    }

    res.json({ ok: true, answer, citations });
  } catch (err) {
    console.error("❌ Ask failed:", err);
    res.status(500).json({ ok: false, error: "Failed to process question" });
  }
});

/**
 * Start server
 */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ AI Compliance Sentinel running at http://localhost:${PORT}`);
  console.log("🧠 Compliance Brain initialized");
  console.log("📚 Regulatory knowledge ready");
  console.log("🛡 Governance guardrails active");
});

