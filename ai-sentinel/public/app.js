const alertsTableBody = document.querySelector("#alertsTable tbody");
const alertDetails = document.getElementById("alertDetails");

async function fetchAlerts() {
  const res = await fetch("/api/alerts");
  const alerts = await res.json();

  alertsTableBody.innerHTML = "";

  alerts.forEach(alert => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${new Date().toLocaleDateString()}</td>
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

function showAlertDetails(alert) {
  alertDetails.classList.remove("hidden");
  alertDetails.innerHTML = `
    <h3>${alert.title}</h3>
    <p><strong>Risk:</strong> ${alert.risk}</p>
    <p>${alert.description}</p>
    <p><strong>Jurisdiction:</strong> ${alert.jurisdiction}</p>
    <h4>Sources</h4>
    <ul>
      ${(alert.citations || []).map(c =>
        `<li>${c.law}: ${c.article}</li>`
      ).join("")}
    </ul>
  `;
}

const runBtn = document.getElementById("runAnalysis");
const refreshBtn = document.getElementById("refresh");

runBtn.addEventListener("click", async () => {
  runBtn.disabled = true;
  runBtn.textContent = "Running...";

  await fetch("/api/analyze", { method: "POST" });
  await fetchAlerts();

  runBtn.textContent = "Run Compliance Analysis";
  runBtn.disabled = false;
});

refreshBtn.addEventListener("click", async () => {
  refreshBtn.disabled = true;
  refreshBtn.textContent = "Refreshing...";

  await fetchAlerts();

  refreshBtn.textContent = "Refresh";
  refreshBtn.disabled = false;
});


document.getElementById("runAnalysis").onclick = async () => {
  await fetch("/api/analyze", { method: "POST" });
  fetchAlerts();
});

};

document.getElementById("refresh").onclick = fetchAlerts;

document.getElementById("askBtn").onclick = async () => {
  const question = document.getElementById("question").value;
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });
  const data = await res.json();
  document.getElementById("answerBox").textContent = data.answer;
};


fetchAlerts();
