document.addEventListener("DOMContentLoaded", () => {

  const alertsTableBody = document.querySelector("#alertsTable tbody");
  const askBtn = document.getElementById("askBtn");

  async function fetchAlerts() {
    const res = await fetch("/api/alerts");
    const alerts = await res.json();

    alertsTableBody.innerHTML = "";

    alerts.forEach(a => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${a.created_at}</td>
        <td>${a.recommended_owner}</td>
        <td>${a.jurisdiction}</td>
        <td>${a.severity}</td>
        <td>${a.risk_score}</td>
        <td>${a.title}</td>
        <td>${a.status}</td>
      `;

      alertsTableBody.appendChild(row);
    });
  }

  /* ======================
     ASK COMPLIANCE BRAIN
  ====================== */

  askBtn.addEventListener("click", async () => {

    const question = document.getElementById("question").value;
    const answerBox = document.getElementById("answerBox");
    const citationsBox = document.getElementById("citationsBox");

    answerBox.textContent = "Thinking...";
    citationsBox.innerHTML = "";

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });

    const data = await res.json();

    answerBox.textContent = data.answer;

    if (data.citations) {
      citationsBox.innerHTML = `
        <h4>Regulation References</h4>
        <ul>
          ${data.citations.map(c =>
            `<li>${c.law} (${c.code})</li>`
          ).join("")}
        </ul>
      `;
    }

    fetchAlerts();
  });

  fetchAlerts();
});
