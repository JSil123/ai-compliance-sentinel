const alertsTableBody = document.querySelector("#alertsTable tbody");
const alertDetails = document.getElementById("alertDetails");

async function fetchAlerts() {
  const res = await fetch("/api/alerts");
  const alerts = await res.json();

  alertsTableBody.innerHTML = "";

  alerts.forEach(alert => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${new Date(alert.created_at).toLocaleDateString()}</td>
      <td>${alert.owner}</td>
      <td>${alert.jurisdiction}</td>
      <td>${alert.severity}</td>
      <td>${alert.risk}</td>
      <td>${alert.title}</td>
      <td>
        <span class="status-chip ${alert.status.toLowerCase()}">
          ${alert.status}
        </span>
      </td>
    `;

    row.onclick = () => showAlertDetails(alert);
    alertsTableBody.appendChild(row);
  });
}

function showAlertDetails(alert) {
  alertDetails.classList.remove("hidden");
  alertDetails.innerHTML = `
    <h3>${alert.title}</h3>
    <p><strong>Risk:</strong> ${alert.risk}</p>
    <p>${alert.description}</p>
    <p><strong>Jurisdiction:</strong> ${alert.jurisdiction}</p>

    <div class="actions">
      <button onclick="updateStatus(${alert.id}, 'ACKNOWLEDGED')">
        Acknowledge
      </button>
      <button onclick="updateStatus(${alert.id}, 'RESOLVED')">
        Resolve
      </button>
    </div>

    <h4>Sources</h4>
    <ul>
      ${(alert.citations || []).map(c =>
        `<li>${c.law}: ${c.article}</li>`
      ).join("")}
    </ul>
  `;
}

async function updateStatus(id, status) {
  await fetch(`/api/alerts/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  fetchAlerts();
}

// Run analysis
document.getElementById("runAnalysis").addEventListener("click", async () => {
  await fetch("/api/analyze", { method: "POST" });
  fetchAlerts();
});

// Refresh
document.getElementById("refresh").addEventListener("click", fetchAlerts);

// Ask Compliance Brain
document.getElementById("askBtn").addEventListener("click", async () => {
  const question = document.getElementById("question").value;

  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });

  const data = await res.json();
  document.getElementById("answerBox").textContent =
    data.answer || "No guidance found.";
});

fetchAlerts();
