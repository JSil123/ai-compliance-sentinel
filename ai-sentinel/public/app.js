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

      if (!Array.isArray(alerts) || alerts.length === 0) {
        alertsTableBody.innerHTML =
          `<tr><td colspan="7">No alerts found</td></tr>`;
        return;
      }

      alerts.forEach(alert => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${alert.created_at ? new Date(alert.created_at).toLocaleDateString() : "-"}</td>
          <td>${alert.owner || alert.recommended_owner || "Legal"}</td>
          <td>${alert.jurisdiction || "GLOBAL"}</td>
          <td>${alert.severity || alert.risk || "Medium"}</td>
          <td>${alert.risk || alert.severity || "Medium"}</td>
          <td>${alert.title || "Regulatory Alert"}</td>
          <td>${alert.status || "OPEN"}</td>
        `;

        row.addEventListener("click", () => showAlertDetails(alert));
        alertsTableBody.appendChild(row);
      });

    } catch (err) {
      console.error("❌ Failed to load alerts", err);
      alertsTableBody.innerHTML =
        `<tr><td colspan="7">Error loading alerts</td></tr>`;
    }
  }

  function showAlertDetails(alert) {
    alertDetails.classList.remove("hidden");

    alertDetails.innerHTML = `
      <h3>${alert.title || "Regulatory Alert"}</h3>

      <p><strong>Risk:</strong> ${alert.risk || alert.severity || "Medium"}</p>
      <p><strong>Owner:</strong> ${alert.owner || alert.recommended_owner || "Legal"}</p>
      <p><strong>Jurisdiction:</strong> ${alert.jurisdiction || "GLOBAL"}</p>

      <p>${alert.description || alert.message || "No additional details provided."}</p>

      <h4>Sources</h4>
      <ul>
        ${(alert.citations || [])
          .map(c => `
            <li>
              ${c.law || c.title || "Source"}
              ${c.article ? ` — ${c.article}` : ""}
            </li>
          `)
          .join("")}
      </ul>
    `;
  }

  // Run Compliance Analysis
  runBtn.addEventListener("click", async () => {
    runBtn.disabled = true;
    runBtn.textContent = "Running...";

    try {
      await fetch("/api/analyze", { method: "POST" });
      await fetchAlerts();
    } catch (err) {
      console.error("❌ Analysis failed", err);
    } finally {
      runBtn.disabled = false;
      runBtn.textContent = "Run Compliance Analysis";
    }
  });

  // Refresh
  refreshBtn.addEventListener("click", fetchAlerts);

  // Ask the Compliance Brain
  askBtn.addEventListener("click", async () => {
    const question = document.getElementById("question").value.trim();
    if (!question) return;

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });

    const data = await res.json();

    document.getElementById("answerBox").textContent =
      data.answer || "No advisory returned.";

    document.getElementById("citationsBox").innerHTML =
      (data.citations || [])
        .map(c =>
          `<div>• ${c.title || c.law} ${c.control || ""}</div>`
        )
        .join("");
  });

  // Initial load
  fetchAlerts();
});
