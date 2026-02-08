const express = require("express");
const path = require("path");
const { getDb } = require("./db");
const { runAnalysis } = require("./analyzer");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

(async () => {
  const db = await getDb();
  await runAnalysis(db);
})();

app.post("/api/analyze", async (req, res) => {
  const db = await getDb();
  await runAnalysis(db);
  res.json({ ok: true });
});

app.get("/api/alerts", async (req, res) => {
  const db = await getDb();
  const rows = await db.all("SELECT * FROM alerts ORDER BY created_at DESC");
  res.json(rows.map(a => ({
    ...a,
    risk: a.severity,
    description: a.message,
    citations: JSON.parse(a.citations || "[]")
  })));
});

app.post("/api/ask", async (req, res) => {
  const { question } = req.body;
  const db = await getDb();

  // Simple keyword logic for demo
  let answer = "";
  let citations = [];

  if (question.toLowerCase().includes("employee") && question.toLowerCase().includes("ai")) {
    answer =
      "AI use involving employee data requires transparency, purpose limitation, and documented impact assessments.";

    citations = await db.all(`
      SELECT title, jurisdiction 
      FROM laws 
      WHERE title LIKE '%AI%' OR title LIKE '%GDPR%'
      LIMIT 3
    `);
  } else {
    answer = "Please consult compliance for further review.";
  }

  await db.close();

  res.json({
    answer,
    citations
  });
});


app.listen(10000, () =>
  console.log("AI Compliance Sentinel running on port 10000")
);

