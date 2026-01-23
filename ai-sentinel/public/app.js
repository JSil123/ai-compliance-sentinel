document.addEventListener("DOMContentLoaded", () => {
  const alertsTableBody = document.querySelector("#alertsTable tbody");
  const alertDetails = document.getElementById("alertDetails");

  const statusFilter = document.getElementById("statusFilter");
  const ownerFilter = document.getElementById("ownerFilter");
  const jurisdictionFilter = document.getElementById("jurisdictionFilter");

  async function fetchAlerts() {
    try {
      const params = new URLSearchParams({
        status: statusFilter.value,
        owner: ownerFilter.value,
        jurisdiction: jurisdictionFilter.value
      });

      const res = await fetch(`/api/alerts?${params.toString()}`);
      const alerts = await res.json();

      alertsTableBody.innerHTML = "";

      if (!alerts.length) {
        alertsTableBody.innerHTML =
          `<tr><td colspan="7">No alerts found.</td></tr>`;
        return;
      }

      alerts.forEach(alert => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${new Date(alert.created_at || Date.now()).toLocaleDateString()}</td>
          <td>${alert.recommended_owner || alert.owner || "Legal"}</td>
          <td>${alert.jurisdiction || "GLOBAL"}</td>
          <td>${alert.severity || "Medium"}</td>
          <td>${alert.risk || alert.severity || "Medium"}</td>
          <td>${alert.title || alert.type}</td>
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
      <h3>${alert.title || alert.type}</h3>
      <p><strong>Risk:</strong> ${alert.severity || alert.risk}</p>
      <p>${alert.message || alert.description}</p>
      <p><strong>Jurisdiction:</strong> ${alert.jurisdiction}</p>
      <h4>Sources</h4>
      <ul>
        ${(alert.citations || [])
          .map(c => `<li>${c.law || c.title} ${c.article || ""}</li>`)
          .join("")}
      </ul>
    `;
  }

  // Run analysis
  document.getElementById("runAnalysis").addEventListener("click", async () => {
    await fetch("/api/analyze", { method: "POST" });
    await fetchAlerts();
  });

  // Refresh
  document.getElementById("refresh").addEventListener("click", fetchAlerts);

  // Ask the Compliance Brain
  document.getElementById("askBtn").addEventListener("click", async () => {
    const question = document.getElementById("question").value.trim();
    const answerBox = document.getElementById("answerBox");
    const citationsBox = document.getElementById("citationsBox");

    if (!question) {
      answerBox.textContent = "Please enter a question.";
      return;
    }

    answerBox.textContent = "Thinking…";
    citationsBox.innerHTML = "";

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });

      const data = await res.json();

      if (!data.ok) {
        answerBox.textContent = data.error || "Unable to answer.";
        return;
      }

      answerBox.textContent = data.answer;

      if (data.citations?.length) {
        citationsBox.innerHTML =
          "<h4>References</h4><ul>" +
          data.citations
            .map(c => `<li>${c.title || c.law}</li>`)
            .join("") +
          "</ul>";
      }
    } catch (err) {
      console.error(err);
      answerBox.textContent = "Error contacting compliance engine.";
    }
  });

  // Initial load
  fetchAlerts();
});
