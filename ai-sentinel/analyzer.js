async function runAnalysis(db) {
  await db.exec("DELETE FROM alerts");

  await db.run(`
    INSERT INTO alerts
    (type, severity, message, source, status, recommended_owner, jurisdiction, citations)
    VALUES
    (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    "New Regulation Detected",
    "High",
    "A new AI-related regulatory obligation has been identified that may impact healthcare data usage.",
    "EU AI Act Monitoring",
    "Open",
    "Legal",
    "EU",
    JSON.stringify([
      { law: "EU AI Act", article: "Article 14", note: "Human oversight required" }
    ])
  ]);
}

module.exports = { runAnalysis };
