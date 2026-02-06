document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.querySelector("#alertsTable tbody");
  const details = document.getElementById("alertDetails");

  async function load() {
    const res = await fetch("/api/alerts");
    const alerts = await res.json();
    tbody.innerHTML = "";
    alerts.forEach(a => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${a.created_at.split(" ")[0]}</td>
        <td>${a.jurisdiction}</td>
        <td>${a.severity}</td>
        <td>${a.title}</td>
        <td>${a.status}</td>
      `;
      tr.onclick = () => {
        details.classList.remove("hidden");
        details.innerHTML = `<p>${a.description}</p>`;
      };
      tbody.appendChild(tr);
    });
  }

  document.getElementById("runAnalysis").onclick = async () => {
    await fetch("/api/analyze", { method: "POST" });
    load();
  };

  document.getElementById("refresh").onclick = load;

  document.getElementById("askBtn").onclick = async () => {
    const q = document.getElementById("question").value;
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q })
    });
    const data = await res.json();
    document.getElementById("answerBox").textContent = data.answer;
  };

  load();
});
