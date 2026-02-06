document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.querySelector("#alertsTable tbody");
  const details = document.getElementById("alertDetails");

  function esc(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderCitations(citations) {
    if (!Array.isArray(citations) || citations.length === 0) {
      return `<p class="muted">No citations available for this alert.</p>`;
    }

    return `
      <h4>Regulatory References</h4>
      <ul class="citations-list">
        ${citations
          .map(c => {
            const law = esc(c.law || c.title || "Regulation");
            const article = esc(c.article || c.section || "Section not provided");
            const summary = esc(c.summary || c.note || "Summary not provided.");
            return `
              <li>
                <strong>${law}</strong> — ${article}<br/>
                <span class="muted">${summary}</span>
              </li>
            `;
          })
          .join("")}
      </ul>
    `;
  }

  function showDetails(a) {
    details.classList.remove("hidden");

    const title = esc(a.title || "Regulatory Alert");
    const severity = esc(a.severity || a.risk || "UNKNOWN");
    const jurisdiction = esc(a.jurisdiction || "GLOBAL");
    const status = esc(a.status || "OPEN");
    const description = esc(a.description || a.message || "");

    details.innerHTML = `
      <h3>${title}</h3>
      <p><strong>Severity:</strong> ${severity}</p>
      <p><strong>Jurisdiction:</strong> ${jurisdiction}</p>
      <p><strong>Status:</strong> ${status}</p>
      <p>${description}</p>
      ${renderCitations(a.citations)}
    `;
  }

  async function load() {
    try {
      const res = await fetch("/api/alerts", { cache: "no-store" });
      if (!res.ok) throw new Error(`Alerts fetch failed: ${res.status}`);
      const alerts = await res.json();

const status = String(a.status || "OPEN").toUpperCase();
const statusClass = status.toLowerCase(); // open / acknowledged / resolved

const severity = String(a.severity || a.risk || "UNKNOWN").toUpperCase();
const riskClass =
  severity === "HIGH" ? "high" :
  severity === "MEDIUM" ? "medium" :
  severity === "LOW" ? "low" : "unknown";

tr.innerHTML = `
  <td>${esc(created)}</td>
  <td>${esc(a.jurisdiction || "GLOBAL")}</td>

  <td>
    <span class="risk-chip ${riskClass}">
      ${esc(severity)}
    </span>
  </td>

  <td>${esc(a.title || "Regulatory Alert")}</td>

  <td>
    <span class="status-chip ${statusClass}">
      ${esc(status)}
    </span>
  </td>
`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${esc(created)}</td>
          <td>${esc(a.jurisdiction || "GLOBAL")}</td>
          <td>${esc(a.severity || a.risk || "UNKNOWN")}</td>
          <td>${esc(a.title || "Regulatory Alert")}</td>
          <td>${esc(a.status || "OPEN")}</td>
        `;

        tr.onclick = () => showDetails(a);
        tbody.appendChild(tr);
      });

      // If there are alerts, auto-select the first one for a nicer demo
      if (alerts.length > 0) showDetails(alerts[0]);
    } catch (e) {
      console.error("❌ Failed to load alerts:", e);
      tbody.innerHTML = `<tr><td colspan="5">Failed to load alerts.</td></tr>`;
    }
  }

  document.getElementById("runAnalysis").onclick = async () => {
    const btn = document.getElementById("runAnalysis");
    btn.disabled = true;
    btn.textContent = "Running...";

    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      if (!res.ok) throw new Error(`Analyze failed: ${res.status}`);
      await load();
    } catch (e) {
      console.error("❌ Run analysis failed:", e);
      alert("Run Compliance Analysis failed. Check Render logs.");
    } finally {
      btn.textContent = "Run Compliance Analysis";
      btn.disabled = false;
    }
  };

  document.getElementById("refresh").onclick = async () => {
    const btn = document.getElementById("refresh");
    btn.disabled = true;
    btn.textContent = "Refreshing...";
    await load();
    btn.textContent = "Refresh";
    btn.disabled = false;
  };

  document.getElementById("askBtn").onclick = async () => {
    const q = document.getElementById("question").value;

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q })
      });

      if (!res.ok) throw new Error(`Ask failed: ${res.status}`);
      const data = await res.json();
      document.getElementById("answerBox").textContent = data.answer || "No answer returned.";
    } catch (e) {
      console.error("❌ Ask failed:", e);
      document.getElementById("answerBox").textContent = "Error contacting compliance engine.";
    }
  };

  load();
});
