// ===============================
// AI Compliance Sentinel - Frontend Logic
// ===============================

// Ask the Compliance Brain
document.getElementById("askBtn").addEventListener("click", askComplianceBrain);

async function askComplianceBrain() {
  const question = document.getElementById("question").value.trim();
  const answerBox = document.getElementById("answerBox");
  const citationsBox = document.getElementById("citationsBox");

  if (!question) {
    answerBox.textContent = "Please enter a compliance question.";
    return;
  }

  answerBox.textContent = "🧠 Analyzing legal, security, and policy requirements...";
  citationsBox.innerHTML = "";

  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });

    const data = await response.json();

    // Build readable response
    let output = "";
    output += `Conclusion:\n${data.conclusion}\n\n`;
    output += `Summary:\n${data.summary}\n\n`;

    output += "Key Legal & Policy Risks:\n";
    data.risks.forEach(r => {
      output += `• ${r.law} — ${r.requirement}\n`;
      output += `  Risk Area: ${r.risk_area} | Severity: ${r.severity}\n`;
      output += `  ${r.description}\n\n`;
    });

    output += "Recommended Actions:\n";
    data.guidance.forEach(g => {
      output += `✓ ${g}\n`;
    });

    answerBox.textContent = output;

    // Show citations
    const laws = [...new Set(data.risks.map(r => r.law))];
    citationsBox.innerHTML =
      "<strong>Referenced Regulations & Guidance:</strong><ul>" +
      laws.map(l => `<li>${l}</li>`).join("") +
      "</ul>";

  } catch (err) {
    console.error(err);
    answerBox.textContent = "❌ Failed to retrieve compliance guidance.";
  }
}
