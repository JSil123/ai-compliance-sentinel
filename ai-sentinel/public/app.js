document.addEventListener("DOMContentLoaded", () => {
  const alertsTableBody = document.querySelector("#alertsTable tbody");
  const alertDetails = document.getElementById("alertDetails");

  const runBtn = document.getElementById("runAnalysis");
  const refreshBtn = document.getElementById("refresh");
  const askBtn = document.getElementById("askBtn");

  const statusFilter = document.getElementById("statusFilter");
  const jurisdictionFilter = document.getElementById("jurisdictionFilter");

  /* ===============================
     FETCH ALERTS
     =============================== */
  async function fetchAlerts() {
    const res = await fetch("/api/alerts");
    const alerts = await res.json();

    alertsTableBody.innerHTML = "";

    alerts.forEach(alert => {
      if (statusFilter.value && alert.status !== statusFilter.value) return;
      if (jurisdictionFilter.value && alert.jurisdiction !== jurisdictionFilter.value) return;

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${new Date(alert.created_at).toLocaleDateString()}</td>
        <td>${alert.recommended_owner || "Legal"}</td>
        <td>${alert.jurisdiction}</td>
        <td>${alert.severity}</td>
        <td>${alert.alert_type || "Compliance Risk"}</td>
        <td class="titleCell">${alert.title}</td>
        <td>
          <span class="status-chip ${alert.status.toLowerCase()}">
            ${alert.status}
          </span>
        </td>
      `;

      row.addEventListener("click", () => showAlertDetails(alert));
      alertsTableBody.appendChild(row);
    });
  }

  /* ===============================
     ALERT DETAILS
     =============================== */
  function showAlertDetails(alert) {
    alertDetails.classList.remove("hidden");

    const citations = Array.isArray(alert.citations)
      ? alert.citations
      : [];

    alertDetails.innerHTML = `
      <h3>${alert.title}</h3>
      <p><strong>Severity:</strong> ${alert.severity}</p>
      <p><strong>Jurisdiction:</strong> ${alert.jurisdiction}</p>
      <p>${alert.description}</p>

      <h4>Regulatory References</h4>
      <ul>
        ${citations.map(c =>
          `<li>${c.law} — ${c.requirement || ""}</li>`
        ).join("")}
      </ul>
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
     ASK THE COMPLIANCE BRAIN
     =============================== */
  askBtn.addEventListener("click", async () => {
    const question = document.getElementById("question").value.trim();
    const answerBox = document.getElementById("answerBox");
    const citationsBox = document.getElementById("citationsBox");

    if (!question) return;

    answerBox.textContent = "Thinking…";
    citationsBox.innerHTML = "";

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });

      const data = await res.json();

      answerBox.textContent = data.answer || "No guidance found.";

      if (data.citations?.length) {
        citationsBox.innerHTML = `
          <h4>Sources</h4>
          <ul>
            ${data.citations.map(c =>
              `<li>${c.law} — ${c.requirement}</li>`
            ).join("")}
          </ul>
        `;
      }

      // Refresh alerts if auto-created
      fetchAlerts();

    } catch (err) {
      answerBox.textContent = "Error contacting compliance engine.";
    }
  });

  /* ===============================
     FILTERS
     =============================== */
  refreshBtn.addEventListener("click", fetchAlerts);

  /* ===============================
     INITIAL LOAD
     =============================== */
  fetchAlerts();
});
