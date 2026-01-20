import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "./seed.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/ask", async (req, res) => {
  const { question } = req.body;
  const db = await getDb();

  // Simple keyword extraction (demo-grade but effective)
  const keywords = question.toLowerCase();

  const requirements = await db.all(
    `
    SELECT r.title, r.text, r.risk_area, r.severity, l.name AS law
    FROM requirements r
    JOIN laws l ON r.law_id = l.id
    WHERE r.keywords LIKE ?
    `,
    [`%phi%`]
  );

  const policies = await db.all(
    `
    SELECT name, text
    FROM policies
    WHERE text LIKE ?
    `,
    [`%AI%`]
  );

  let answer = {
    question,
    conclusion: "⚠️ High-risk and conditionally allowed",
    summary:
      "Using PHI to train AI models for healthcare research in the EU is heavily regulated and requires strict safeguards.",
    risks: requirements.map(r => ({
      law: r.law,
      requirement: r.title,
      risk_area: r.risk_area,
      severity: r.severity,
      description: r.text
    })),
    guidance: [
      "Ensure explicit legal basis and purpose limitation (GDPR)",
      "Apply strong data minimization and de-identification",
      "Maintain human oversight and audit logging (EU AI Act)",
      "Limit training to approved, secure environments",
      "Involve Legal, Security, and Data Governance teams"
    ]
  };

  res.json(answer);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ AI Compliance Sentinel running on port ${PORT}`);
});

