const { getDb } = require("./db");

async function seed() {
  const db = await getDb();

  // Drop tables (for repeatable demos)
  await db.exec(`
    DROP TABLE IF EXISTS laws;
    DROP TABLE IF EXISTS requirements;
    DROP TABLE IF EXISTS policies;
    DROP TABLE IF EXISTS policy_controls;
    DROP TABLE IF EXISTS hr_artifacts;
    DROP TABLE IF EXISTS alerts;
  `);

  // Create schema
  await db.exec(`
    CREATE TABLE laws (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      jurisdiction TEXT NOT NULL,
      category TEXT NOT NULL,           -- AI_GOV, DATA_PRIVACY, EMPLOYMENT, INFOSEC
      effective_date TEXT NOT NULL,
      source_url TEXT NOT NULL,
      summary TEXT NOT NULL
    );

    CREATE TABLE requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      law_id INTEGER NOT NULL,
      requirement_code TEXT NOT NULL,   -- e.g., EUAI-HR-01
      title TEXT NOT NULL,
      text TEXT NOT NULL,
      risk_area TEXT NOT NULL,          -- SECURITY, PRIVACY, FAIRNESS, AUDIT, SAFETY
      recommended_owner TEXT NOT NULL,  -- Security, HR, Legal, DataGov
      severity INTEGER NOT NULL,        -- 1-5
      keywords TEXT NOT NULL,           -- comma-separated keywords
      FOREIGN KEY (law_id) REFERENCES laws(id)
    );

    CREATE TABLE policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      policy_area TEXT NOT NULL,        -- AI, PRIVACY, HR, SECURITY
      jurisdiction_scope TEXT NOT NULL, -- GLOBAL, EU, US, etc.
      version TEXT NOT NULL,
      last_reviewed TEXT NOT NULL,
      owner_team TEXT NOT NULL,         -- Security, HR, Legal, DataGov
      text TEXT NOT NULL
    );

    CREATE TABLE policy_controls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_id INTEGER NOT NULL,
      control_code TEXT NOT NULL,       -- e.g., POL-AI-LOGGING
      title TEXT NOT NULL,
      text TEXT NOT NULL,
      keywords TEXT NOT NULL,           -- comma-separated
      coverage_score INTEGER NOT NULL,  -- 0-100 (what policy claims)
      FOREIGN KEY (policy_id) REFERENCES policies(id)
    );

    CREATE TABLE hr_artifacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      artifact_type TEXT NOT NULL,      -- PAY_BANDS, BENEFITS
      region TEXT NOT NULL,             -- US, EU, UK, etc.
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      last_updated TEXT NOT NULL
    );

    CREATE TABLE alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      alert_type TEXT NOT NULL,         -- LAW_CHANGE, POLICY_GAP, HR_RISK, DATA_RISK
      jurisdiction TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      recommended_owner TEXT NOT NULL,  -- Security, HR, Legal, DataGov
      risk_score INTEGER NOT NULL,      -- 1-100
      severity INTEGER NOT NULL,        -- 1-5
      citations TEXT NOT NULL,          -- JSON string list of sources
      status TEXT NOT NULL              -- OPEN, ACKNOWLEDGED, RESOLVED
    );
  `);

  // Insert Laws
  const laws = [
    {
      name: "EU AI Act (High-Risk Systems)",
      jurisdiction: "EU",
      category: "AI_GOV",
      effective_date: "2026-01-01",
      source_url: "https://example.com/eu-ai-act-summary",
      summary: "Defines requirements for high-risk AI systems including documentation, human oversight, logging, and risk management."
    },
    {
  type: "Model Training Risk",
  severity: "High",
  message: "Training data includes sensitive biometric identifiers.",
  jurisdiction: "EU",
  recommended_owner: "Security",
  status: "OPEN",
  citations: JSON.stringify([
    { law: "GDPR", article: "Article 9" }
  ])
},
{
  type: "Workforce Impact Assessment Required",
  severity: "Medium",
  message: "AI system may impact hiring or employee evaluation.",
  jurisdiction: "US",
  recommended_owner: "HR",
  status: "ACKNOWLEDGED",
  citations: JSON.stringify([
    { law: "EEOC AI Guidance" }
  ])
},
{
  type: "Model Explainability Gap",
  severity: "High",
  message: "High-risk model lacks human-interpretable explanations.",
  jurisdiction: "EU",
  recommended_owner: "Legal",
  status: "OPEN",
  citations: JSON.stringify([
    { law: "EU AI Act", article: "Article 13" }
  ])
},
    {
      name: "GDPR (General Data Protection Regulation)",
      jurisdiction: "EU",
      category: "DATA_PRIVACY",
      effective_date: "2018-05-25",
      source_url: "https://example.com/gdpr-summary",
      summary: "Data protection law covering lawful basis, data minimization, subject rights, and breach handling."
    },
    {
      name: "HIPAA Security Rule",
      jurisdiction: "US",
      category: "DATA_PRIVACY",
      effective_date: "2005-04-20",
      source_url: "https://example.com/hipaa-security-summary",
      summary: "Safeguards for electronic protected health information including access control, audit controls, integrity, and transmission security."
    },
    {
      name: "EDPS Guidance on Generative AI for EU Institutions",
      jurisdiction: "EU",
      category: "AI_GOV",
      effective_date: "2024-06-01",
      source_url: "https://example.com/edps-genai-guidance",
      summary: "Guidance emphasizing human oversight, traceability, data minimization, and privacy protections for GenAI use."
    },
    {
      name: "Pay Transparency Rule (Example Global Policy Driver)",
      jurisdiction: "GLOBAL",
      category: "EMPLOYMENT",
      effective_date: "2025-07-01",
      source_url: "https://example.com/pay-transparency",
      summary: "Requires structured pay band disclosures and documentation to support fair compensation practices."
    }
  ];

  const lawIds = [];
  for (const law of laws) {
    const res = await db.run(
      `INSERT INTO laws (name, jurisdiction, category, effective_date, source_url, summary)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [law.name, law.jurisdiction, law.category, law.effective_date, law.source_url, law.summary]
    );
    lawIds.push(res.lastID);
  }

  // Insert Requirements (each is an atomic rule the analyzer checks)
  const reqs = [
    // EU AI Act (High Risk)
    {
      lawIndex: 0,
      requirement_code: "EUAI-HR-01",
      title: "Human Oversight",
      text: "High-risk AI must include human oversight to prevent or minimize risks to health, safety, or fundamental rights.",
      risk_area: "SAFETY",
      recommended_owner: "Legal",
      severity: 5,
      keywords: "human oversight,override,review,high-risk,clinician"
    },
    {
      lawIndex: 0,
      requirement_code: "EUAI-HR-02",
      title: "Logging & Traceability",
      text: "High-risk AI must enable automatic logging to ensure traceability and support audits and incident investigation.",
      risk_area: "AUDIT",
      recommended_owner: "Security",
      severity: 5,
      keywords: "logging,traceability,audit,monitoring,incident"
    },
    {
      lawIndex: 0,
      requirement_code: "EUAI-HR-03",
      title: "Risk Management System",
      text: "High-risk AI must maintain a documented risk management process across the lifecycle.",
      risk_area: "SECURITY",
      recommended_owner: "DataGov",
      severity: 4,
      keywords: "risk management,lifecycle,documentation,governance"
    },

    // GDPR
    {
      lawIndex: 1,
      requirement_code: "GDPR-01",
      title: "Data Minimization",
      text: "Personal data must be adequate, relevant, and limited to what is necessary.",
      risk_area: "PRIVACY",
      recommended_owner: "DataGov",
      severity: 4,
      keywords: "data minimization,least data,privacy,retention"
    },
    {
      lawIndex: 1,
      requirement_code: "GDPR-02",
      title: "Access Control & Confidentiality",
      text: "Implement appropriate security including access control and confidentiality protections for personal data.",
      risk_area: "SECURITY",
      recommended_owner: "Security",
      severity: 4,
      keywords: "access control,least privilege,confidentiality,encryption"
    },

    // HIPAA
    {
      lawIndex: 2,
      requirement_code: "HIPAA-01",
      title: "Audit Controls",
      text: "Implement hardware, software, and procedural mechanisms that record and examine system activity involving ePHI.",
      risk_area: "AUDIT",
      recommended_owner: "Security",
      severity: 5,
      keywords: "audit logs,logging,monitoring,ephi"
    },
    {
      lawIndex: 2,
      requirement_code: "HIPAA-02",
      title: "Transmission Security",
      text: "Protect ePHI transmitted over electronic networks using security measures such as encryption.",
      risk_area: "SECURITY",
      recommended_owner: "Security",
      severity: 4,
      keywords: "encryption,tls,transmission,ephi"
    },

    // EDPS GenAI Guidance
    {
      lawIndex: 3,
      requirement_code: "EDPS-01",
      title: "Human in the Loop",
      text: "GenAI use must ensure meaningful human oversight and accountability for outcomes.",
      risk_area: "ACCOUNTABILITY",
      recommended_owner: "Legal",
      severity: 4,
      keywords: "human oversight,accountability,approval,review"
    },
    {
      lawIndex: 3,
      requirement_code: "EDPS-02",
      title: "Data Minimization & Sensitive Data Controls",
      text: "Avoid unnecessary processing; limit sensitive data exposure and apply strict controls.",
      risk_area: "PRIVACY",
      recommended_owner: "DataGov",
      severity: 5,
      keywords: "data minimization,sensitive data,phi,pii,dlp"
    },

    // Pay transparency (demo rule)
    {
      lawIndex: 4,
      requirement_code: "PAY-01",
      title: "Pay Band Documentation",
      text: "Compensation ranges should be documented and available for applicable roles to support fair pay transparency.",
      risk_area: "FAIRNESS",
      recommended_owner: "HR",
      severity: 4,
      keywords: "pay band,compensation range,job level,transparency"
    }
  ];

  for (const r of reqs) {
    const law_id = lawIds[r.lawIndex];
    await db.run(
      `INSERT INTO requirements
       (law_id, requirement_code, title, text, risk_area, recommended_owner, severity, keywords)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [law_id, r.requirement_code, r.title, r.text, r.risk_area, r.recommended_owner, r.severity, r.keywords]
    );
  }

  // Insert Policies (mock company policies)
  const policies = [
    {
      name: "AI Use Policy",
      policy_area: "AI",
      jurisdiction_scope: "GLOBAL",
      version: "1.2",
      last_reviewed: "2025-03-15",
      owner_team: "DataGov",
      text: "Defines acceptable AI usage, approved tools, data handling restrictions, and human review requirements for high-stakes decisions."
    },
    {
      name: "Data Classification & Handling Standard",
      policy_area: "PRIVACY",
      jurisdiction_scope: "GLOBAL",
      version: "2.0",
      last_reviewed: "2024-11-01",
      owner_team: "Security",
      text: "Classifies data (Public/Internal/Confidential/Restricted) and defines encryption, access control, retention, and audit requirements."
    },
    {
      name: "Compensation & Pay Band Guideline",
      policy_area: "HR",
      jurisdiction_scope: "GLOBAL",
      version: "0.9",
      last_reviewed: "2024-08-10",
      owner_team: "HR",
      text: "Defines pay band structures and ranges; includes review cadence but lacks region-specific disclosure requirements."
    },
    {
      name: "Incident Response & Audit Logging Policy",
      policy_area: "SECURITY",
      jurisdiction_scope: "GLOBAL",
      version: "3.4",
      last_reviewed: "2025-01-05",
      owner_team: "Security",
      text: "Requires security event logging, retention, alerting thresholds, and incident escalation paths."
    }
  ];

  const policyIds = [];
  for (const p of policies) {
    const res = await db.run(
      `INSERT INTO policies (name, policy_area, jurisdiction_scope, version, last_reviewed, owner_team, text)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [p.name, p.policy_area, p.jurisdiction_scope, p.version, p.last_reviewed, p.owner_team, p.text]
    );
    policyIds.push(res.lastID);
  }

  // Insert Controls (what policies claim to cover)
  const controls = [
    // AI Use Policy controls
    {
      policyIndex: 0,
      control_code: "POL-AI-HIL",
      title: "Human Review Requirement",
      text: "Human review is required for high-stakes AI outputs impacting employment, health decisions, or access to services.",
      keywords: "human oversight,review,approval,high-stakes",
      coverage_score: 70
    },
    {
      policyIndex: 0,
      control_code: "POL-AI-DATA",
      title: "Restricted Data in AI Tools",
      text: "Restricted data (PHI/PII) cannot be used in non-approved AI tools; use approved environments with logging and DLP.",
      keywords: "phi,pii,dlp,approved tools,data minimization",
      coverage_score: 65
    },

    // Data Classification controls
    {
      policyIndex: 1,
      control_code: "POL-DATA-ENC",
      title: "Encryption in Transit",
      text: "All Restricted data must be encrypted in transit using approved TLS standards.",
      keywords: "encryption,tls,transmission,ephi",
      coverage_score: 80
    },
    {
      policyIndex: 1,
      control_code: "POL-DATA-ACCESS",
      title: "Least Privilege Access",
      text: "Restricted data access requires least privilege and role-based controls.",
      keywords: "least privilege,access control,confidentiality",
      coverage_score: 75
    },

    // Pay band guideline
    {
      policyIndex: 2,
      control_code: "POL-HR-PAYBANDS",
      title: "Pay Bands Defined",
      text: "Compensation ranges are defined by job level; review occurs annually.",
      keywords: "pay band,compensation range,job level",
      coverage_score: 55
    },

    // Logging policy
    {
      policyIndex: 3,
      control_code: "POL-SEC-LOGS",
      title: "Audit Logging Baseline",
      text: "Critical systems must generate audit logs; logs retained for 1 year; alerts for anomalous authentication.",
      keywords: "audit logs,logging,monitoring,traceability,incident",
      coverage_score: 85
    }
  ];

  for (const c of controls) {
    const policy_id = policyIds[c.policyIndex];
    await db.run(
      `INSERT INTO policy_controls (policy_id, control_code, title, text, keywords, coverage_score)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [policy_id, c.control_code, c.title, c.text, c.keywords, c.coverage_score]
    );
  }

  // HR artifacts (mock)
  const hrArtifacts = [
    {
      artifact_type: "PAY_BANDS",
      region: "EU",
      name: "EU Pay Bands (Mock)",
      content: JSON.stringify([
        { role: "Software Engineer I", bandMin: 55000, bandMax: 75000, currency: "EUR", posted: false },
        { role: "Data Analyst", bandMin: 48000, bandMax: 68000, currency: "EUR", posted: true }
      ]),
      last_updated: "2024-09-10"
    },
    {
      artifact_type: "BENEFITS",
      region: "GLOBAL",
      name: "Benefits Summary (Mock)",
      content: "Benefits include medical, dental, and parental leave. Eligibility varies by region. Language under review for inclusivity.",
      last_updated: "2024-10-22"
    }
  ];

  for (const h of hrArtifacts) {
    await db.run(
      `INSERT INTO hr_artifacts (artifact_type, region, name, content, last_updated)
       VALUES (?, ?, ?, ?, ?)`,
      [h.artifact_type, h.region, h.name, h.content, h.last_updated]
    );
  }

  // Start with empty alerts
  // (Analyzer will generate them)

  await db.close();
  console.log("✅ Database seeded successfully.");
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});

