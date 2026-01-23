const alertsTableBody = document.querySelector("#alertsTable tbody");
const alertDetails = document.getElementById("alertDetails");

const statusFilter = document.getElementById("statusFilter");
const ownerFilter = document.getElementById("ownerFilter");
const jurisdictionFilter = document.getElementById("jurisdictionFilter");

const answerBox = document.getElementById("answerBox");
const citationsBox = document.getElementById("citationsBox");

/* ============================
   ALERTS
============================ */

async function fetchAlerts() {
  try {
    const params = new URLSearchParams();

    if (statusFilter.value) params.append("status", statusFilter.value);
    if (ownerFilter.value) params.append("owner", ownerFilter.value);
    if (jurisdictionFilter.value) params.append("jurisdiction", jurisdictionFilter.value);

    const res = await fetch(`/api/alerts?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to load alerts");

    const alerts = await res.json();
    alertsTableBody.innerHTML = "";

    if (!alerts.length) {
      alertsTableBody.innerHTML = `<tr><td colspan="7">No alerts found.</td></tr>`;
      alertDetails.classList.add("hidden");
      return;
    }

    alerts.forEach(alert => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${new Date(alert.created_at || Date.now()).toLocaleDateString()}</td>
        <td>${alert.recommended_owner || "Legal"}</td>
        <td>${alert.jurisdiction || "GLOBAL"}</td>
        <td>${alert.severity || "Medium"}</td>
        <td>${alert.severity || "Medium"}</td>
        <td>${alert.title || "Regulatory Alert"}</td>
        <td>${alert.status || "OPEN"}</td>
      `;

      row.addEventListener("click", () => showAlertDetails(alert));
      alertsTableBody.appendChild(row);
    });
  } catch (err) {
    console.error(err);
    alertsTableBody.innerHTML =
      `<tr><td colspan="7">Error loading alerts.</td></tr>`;
  }
}

function showAlertDetails(alert) {
  alertDetails.classList.remove("hidden");

  alertDetails.innerHTML = `
    <h3>${alert.title || "Regulatory Alert"}</h3>
    <p><strong>Risk:</strong> ${alert.severity || "Medium"}</p>
    <p>${alert.message || alert.description || "No description available."}</p>
    <p><strong>Jurisdiction:</strong> ${alert.jurisdiction || "GLOBAL"}</p>

    <h4>Sources</h4>
    <ul>
      ${(alert.citations || []).map(c =>
        `<li>${c.title || c.law} ${c.article ? `(${c.article})` : ""}</li>`
      ).join("") || "<li>No citations available.</li>"}
    </ul>
  `;
}

/* ============================
   BUTTONS
============================ */

document.getElementById("runAnalysis").addEventListener("click", async () => {
  try {
    await fetch("/api/analyze", { method: "POST" });
    await fetchAlerts();
  } catch {
    alert("Analysis failed.");
  }
});

document.getElementById("refresh").addEventListener("click", fetchAlerts);

statusFilter.addEventListener("change", fetchAlerts);
ownerFilter.addEventListener("change", fetchAlerts);
jurisdictionFilter.addEventListener("change", fetchAlerts);

/* ============================
   COMPLIANCE BRAIN
============================ */

document.getElementById("askBtn").addEventListener("click", async () => {
  const question = document.getElementById("question").value.trim();
  if (!question) return;

  answerBox.textContent = "Analyzing...";
  citationsBox.innerHTML = "";

  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ask failed");

    answerBox.textContent = data.answer;

    citationsBox.innerHTML = `
      <h4>Citations</h4>
      <ul>
        ${(data.citations || []).map(c =>
          `<li>${c.title || c.law} ${c.requirement || c.control || ""}</li>`
        ).join("")}
      </ul>
    `;
  } catch (err) {
    console.error(err);
    answerBox.textContent = "Error contacting compliance engine.";
  }
});

/* ============================
   INIT
============================ */

fetchAlerts();
