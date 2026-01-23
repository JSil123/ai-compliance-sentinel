document.addEventListener("DOMContentLoaded", () => {
  const alertsTableBody = document.querySelector("#alertsTable tbody");
  const alertDetails = document.getElementById("alertDetails");

  const runBtn = document.getElementById("runAnalysis");
  const refreshBtn = document.getElementById("refresh");
  const askBtn = document.getElementById("askBtn");

  async function fetchAlerts() {
    try {
      const res = await fetch("/api/alerts");
      const alerts = await res.json();

      alertsTableBody.innerHTML = "";

      alerts.forEach(alert => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${new Date().toLocaleDateString()}</td>
          <td>${alert.owner || "Legal"}</td>
          <td>${alert.jurisdiction || "GLOBAL"}</td>
          <td>${alert.risk || "Medium"}</td>
          <td>${alert.risk || "Medium"}</td>
          <td>${alert.title}</td>
          <td>OPEN</td>
        `;

        row.addEventListener("click", () => showAlertDetails(alert));
        alertsTableBody.appendChild(row);
      });
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    }
  }

  function showAlertDetails(alert) {
    alertDetails.classList.remove("hidden");
    alertDetails.innerHTML = `
      <h3>${alert.title}</h3>
      <p><strong>Risk:</strong> ${alert.risk}</p>
      <p>${alert.description}</p>
      <p><strong>Jurisdiction:</strong> ${alert.jurisdiction}</p>
      <h4>Sources</h4>
      <ul>
        ${(alert.citations || [])
          .map(c => `<li>${c.law || c.title} ${c.article || ""}</li>`)
          .join("")}
      </ul>
    `;
  }

  // Run Compliance Analysis
  runBtn.addEventListener("click", async () => {
    runBtn.disabled = true;
    runBtn.textContent = "Running...";

    await fetch("/api/analyze", { method: "POST" });
    await fetchAlerts();

    runBtn.textContent = "Run Compliance Analysis";
    runBtn.disabled = false;
  });

  // Refresh Alerts
  refreshBtn.addEventListener("click", fetchAlerts);

  // Ask the Compliance Brain
  askBtn.addEventListener("click", async () => {
    const question = document.getElementById("question").value;

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });

    const data = await res.json();
    document.getElementById("answerBox").textContent =
      data.answer || "No response generated.";
  });

  // Initial load
  fetchAlerts();
});
