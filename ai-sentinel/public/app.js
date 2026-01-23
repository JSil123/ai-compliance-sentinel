document.addEventListener("DOMContentLoaded", () => {
  const alertsTableBody = document.querySelector("#alertsTable tbody");
  const alertDetails = document.getElementById("alertDetails");

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
          .map(c => `<li>${c.law} ${c.article || ""}</li>`)
          .join("")}
      </ul>
    `;
  }

  document.getElementById("runAnalysis").addEventListener("click", async () => {
  const btn = document.getElementById("runAnalysis");
  btn.disabled = true;
  btn.textContent = "Running...";

  await fetch("/api/analyze", { method: "POST" });
  await fetchAlerts();

  btn.textContent = "Run Compliance Analysis";
  btn.disabled = false;
});

document.getElementById("refresh").addEventListener("click", fetchAlerts);
