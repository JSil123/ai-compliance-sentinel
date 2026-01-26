document.addEventListener("DOMContentLoaded", () => {
  const alertsTableBody = document.querySelector("#alertsTable tbody");
  const alertDetails = document.getElementById("alertDetails");

  const runBtn = document.getElementById("runAnalysis");
  const refreshBtn = document.getElementById("refresh");
  const askBtn = document.getElementById("askBtn");

  const statusFilter = document.getElementById("statusFilter");
  const ownerFilter = document.getElementById("ownerFilter");
  const jurisdictionFilter = document.getElementById("jurisdictionFilter");

  /* ===============================
     FETCH ALERTS
     =============================== */
  async function fetchAlerts() {
    const params = new URLSearchParams();

    if (statusFilter.value) params.append("status", statusFilter.value);
    if (ownerFilter.value) params.append("owner", ownerFilter.value);
    if (jurisdictionFilter.value) params.append("jurisdiction", jurisdictionFilter.value);

    const res = await fetch(`/api/alerts?${params.toString()}`);
    const alerts = await res.json();

    alertsTableBody.innerHTML = "";

    alerts.forEach(alert => {
      const row = document.createElement("tr");

      const statusClass = alert.status?.toLowerCase() || "open";

      row.innerHTML = `
        <td>${new Date().toLocaleDateString()}</td>
        <td>${alert.owner || "Legal"}</td>
        <td>${alert.jurisdiction}</td>
        <td>${alert.severity}</td>
        <td>${alert.severity}</td>
        <td class="titleCell">${alert.title}</td>
        <td>
          <span class="status-chip ${statusClass}">
            ${alert.status}
          </span>
        </td>
      `;

      row.addEventListener("click", () => showAlertDetails(alert));
      alertsTableBody.appendChild(row);
    });
  }

  /* ===============================
     ALERT DETAILS PANEL
     =============================== */
  function showAlertDetails(alert) {
    alertDetails.classList.remove("hidden");

    alertDetails.innerHTML = `
      <h3>${alert.title}</h3>
      <p><strong>Risk:</strong> ${alert.severity}</p>
      <p>${alert.description}</p>
      <p><strong>Jurisdiction:</strong> ${alert.jurisdiction}</p>

      <h4>Sources</h4>
      <ul>
        ${(alert.citations || []).map(c =>
          `<li>${c.law}: ${c.article}</li>`
        ).join("")}
      </ul>

      <div style="margin-top:12px">
        <button data-action="ACKNOWLEDGED">Acknowledge</button>
        <button data-action="RESOLVED">Resolve</button>
      </div>
    `;
  }

  /* ===============================
     RUN ANALYSIS
     =============================== */
  runBtn.addEventListener("click", async () => {
    runBtn.disabled = true;
    runBtn.textContent = "Running…";

    await fetch("/api/analyze", { method: "POST" });
    await fetchAlerts();

    runBtn.textContent = "Run Compliance Analysis";
    runBtn.disabled = false;
  });

  /* ===============================
     REFRESH
     =============================== */
  refreshBtn.addEventListener("click", fetchAlerts);

  /* ===============================
     ASK THE COMPLIANCE BRAIN
     =============================== */
  askBtn.addEventListener("click", async () => {
    const question = document.getElementById("question").value;
    const answerBox = document.getElementById("answerBox");

    answerBox.textContent = "Thinking…";

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });

      const data = await res.json();
      answerBox.textContent = data.answer || "No answer available.";
    } catch {
      answerBox.textContent = "Error contacting compliance engine.";
    }
  });

  /* ===============================
     INITIAL LOAD
     =============================== */
  fetchAlerts();
});
