const alertsTableBody = document.querySelector("#alertsTable tbody");
const alertDetails = document.getElementById("alertDetails");

/**
 * Load alerts
 */
async function fetchAlerts() {
  const res = await fetch("/api/alerts");
  const alerts = await res.json();

  alertsTableBody.innerHTML = "";

  alerts.forEach(alert => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${new Date(alert.created).toLocaleDateString()}</td>
      <td>${alert.owner}</td>
      <td>${alert.jurisdiction}</td>
      <td>${alert.severity}</td>
      <td>${alert.risk}</td>
      <td>${alert.title}</td>
      <td>${alert.status}</td>
    `;

    row.onclick = () => showAlertDetails(alert);
    alertsTableBody.appendChild(row);
  });
}

/**
 * Alert details panel
 */
function showAlertDetails(alert) {
  alertDetails.classList.remove("hidden");
  alertDetails.innerHTML = `
    <h3>${alert.title}</h3>
    <p><strong>Risk:</strong> ${alert.risk}</p>
    <p>${alert.description}</p>
    <p><strong>Jurisdiction:</strong> ${alert.jurisdiction}</p>
    <h4>Sources</h4>
    <ul>
      ${alert.citations
        .map(c => `<li>${c.law}: ${c.article}</li>`)
        .join("")}
    </ul>
  `;
}

/**
 * Run analysis button
 */
document.getElementById("runAnalysis").onclick = async () => {
  await fetch("/api/analyze", { method: "POST" });
  await fetchAlerts();
};

/**
 * Refresh button
 */
document.getElementById("refresh").onclick = fetchAlerts;

/**
 * Ask Compliance Brain
 */
document.getElementById("askBtn").onclick = async () => {
  const question = document.getElementById("question").value;

  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });

  const data = await res.json();
  document.getElementById("answerBox").textContent =
    data.answer || "No response.";
};

/**
 * Initial load
 */
fetchAlerts();
