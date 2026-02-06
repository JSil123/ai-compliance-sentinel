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
  const q = (req.body.question || "").toLowerCase();
  let answer = "No direct regulatory conflicts detected.";

  if (q.includes("phi")) {
    answer =
      "PHI use requires GDPR lawful basis, minimization, and human oversight.";
  } else if (q.includes("bias")) {
    answer =
      "Bias monitoring and fairness testing are required for high-risk AI.";
  }

  res.json({ answer });
});

app.listen(10000, () =>
  console.log("AI Compliance Sentinel running on port 10000")
);
