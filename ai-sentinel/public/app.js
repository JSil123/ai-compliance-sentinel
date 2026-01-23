document.addEventListener("DOMContentLoaded", () => {
  const alertsTableBody = document.querySelector("#alertsTable tbody");
  const alertDetails = document.getElementById("alertDetails");

  const statusFilter = document.getElementById("statusFilter");
  const ownerFilter = document.getElementById("ownerFilter");
  const jurisdictionFilter = document.getElementById("jurisdictionFilter");

  const answerBox = document.getElementById("answerBox");
  const citationsBox = document.getElementById("citationsBox");

  async function fetchAlerts() {
    try {
      const params = new URLSearchParams();

      if (statusFilter.value) params.append("status", statusFilter.value);
      if (ownerFilter.value) params.append("owner", ownerFilter.value);
      if (jurisdictionFilter.value)
        params.append("jurisdiction", jurisdictionFilter.value);

      const res = await fetch(`/api/alerts?${params.toString()}`);
      const alerts = await res.json();

      alertsTableBody.innerHTML = "";
      alertDetails.classList.add("hidden");

      alerts.forEach(alert => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${new Date(alert.created_at || Date.now()).toLocaleDateString()}</td>
          <td>${alert.recommended_owner || "Legal"}</td>
          <td>${alert.jurisdiction || "GLOBAL"}</td>
          <td>${alert.severity || "MEDIUM"}</td>
          <td>${alert.risk || alert.severity}</td>
          <td>${alert.title}</td>
          <td>${alert.status || "OPEN"}</td>
        `;

        row.addEventListener("click", () => showAlertDetails(alert));
        alertsTableBody.appendChild(row);
      });
    } catch (err) {
      console.error("❌ Failed to load alerts", err);
    }
  }

  function showAlertDetails(alert) {
    alertDetails.classList.remove("hidden");

    alertDetails.innerHTML = `
      <h3>${alert.title}</h3>
      <p><strong>Risk:</strong> ${alert.risk}</p>
      <p>${alert.message || alert.description || ""}</p>
      <p><strong>Jurisdiction:</strong> ${alert.jurisdiction}</p>
      <h4>Sources</h4>
      <ul>
        ${(alert.citations || [])
          .map(c => `<li>${c.law || c.title}: ${c.article || ""}</li>`)
          .join("")}
      </ul>
    `;
  }

  // Run Compliance Analysis
  document.getElementById("runAnalysis").addEventListener("click", async () => {
    await fetch("/api/analyze", { method: "POST" });
    await fetchAlerts();
  });

  // Refresh
  document.getElementById("refresh").addEventListener("click", fetchAlerts);

  // Ask Compliance Brain
  document.getElementById("askBtn").addEventListener("click", async () => {
    const question = document.getElementById("question").value.trim();

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

      answerBox.textContent = data.answer || "No answer.";

      if (data.citations?.length) {
        citationsBox.innerHTML = `
          <h4>Citations</h4>
          <ul>
            ${data.citations
              .map(
                c =>
                  `<li><strong>${c.type}:</strong> ${c.title || c.law}</li>`
              )
              .join("")}
          </ul>
        `;
      }
    } catch (err) {
      answerBox.textContent = "Error contacting compliance engine.";
    }
  });

  // Initial load
  fetchAlerts();
});
