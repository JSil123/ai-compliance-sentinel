document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.querySelector("#alertsTable tbody");
  const details = document.getElementById("alertDetails");

  // Optional filters (if your HTML has them; safe if it doesn't)
  const statusFilter = document.getElementById("statusFilter");
  const ownerFilter = document.getElementById("ownerFilter");
  const jurisdictionFilter = document.getElementById("jurisdictionFilter");

  function esc(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function riskClassFrom(severity) {
    const sev = String(severity || "UNKNOWN").toUpperCase();
    if (sev === "HIGH") return "high";
    if (sev === "MEDIUM") return "medium";
    if (sev === "LOW") return "low";
    return "unknown";
  }

  function statusClassFrom(status) {
    const s = String(status || "OPEN").toUpperCase();
    // expects: open / acknowledged / resolved
    return s.toLowerCase();
  }

  function renderRiskChip(severity) {
    const sev = String(severity || "UNKNOWN").toUpperCase();
    const cls = riskClassFrom(sev);
    return `<span class="risk-chip ${cls}">${esc(sev)}</span>`;
  }

  function renderStatusChip(status) {
    const s = String(status || "OPEN").toUpperCase();
    const cls = statusClassFrom(s);
    return `<span class="status-chip ${cls}">${esc(s)}</span>`;
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
    const jurisdiction = esc(a.jurisdiction || "GLOBAL");
    const severity = String(a.severity || a.risk || "UNKNOWN").toUpperCase();
    const status = String(a.status || "OPEN").toUpperCase();
    const description = esc(a.description || a.message || "");

    details.innerHTML = `
      <h3>${title}</h3>
      <p><strong>Severity:</strong> ${renderRiskChip(severity)}</p>
      <p><strong>Jurisdiction:</strong> ${jurisdiction}</p>
      <p><strong>Status:</strong> ${renderStatusChip(status)}</p>
      <p>${description}</p>
      ${renderCitations(a.citations)}
    `;
  }

  function buildQueryString() {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter.value) params.set("status", statusFilter.value);
    if (ownerFilter && ownerFilter.value) params.set("owner", ownerFilter.value);
    if (jurisdictionFilter && jurisdictionFilter.value) params.set("jurisdiction", jurisdictionFilter.value);
    const s = params.toString();
    return s ? `?${s}` : "";
  }

  async function load() {
    try {
      const res = await fetch(`/api/alerts${buildQueryString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Alerts fetch failed: ${res.status}`);
      const alerts = await res.json();

      tbody.innerHTML = "";

      alerts.forEach(a => {
        const created =
          a.created_at && typeof a.created_at === "string"
            ? a.created_at.split(" ")[0]
            : new Date().toISOString().split("T")[0];

        const severity = String(a.severity || a.risk || "UNKNOWN").toUpperCase();
        const status = String(a.status || "OPEN").toUpperCase();

const owner = a.owner || a.recommended_owner || "Legal";
const jurisdiction = a.jurisdiction || "GLOBAL";

// Convert "HIGH" -> "High", "MEDIUM" -> "Medium", "LOW" -> "Low"
const sevRaw = String(a.severity || a.risk || "UNKNOWN").toUpperCase();
const severityText =
  sevRaw.charAt(0) + sevRaw.slice(1).toLowerCase();

// In your original card, Risk mirrored Severity (High/Medium/Low)
const riskText = severityText;

const tr = document.createElement("tr");
tr.innerHTML = `
  <td>${esc(created)}</td>
  <td>${esc(owner)}</td>
  <td>${esc(jurisdiction)}</td>
  <td>${esc(severityText)}</td>
  <td>${esc(riskText)}</td>
  <td class="titleCell">${esc(a.title || "Regulatory Alert")}</td>
  <td>${renderStatusChip(status)}</td>
`;


        tr.onclick = () => showDetails(a);
        tbody.appendChild(tr);
      });

      if (alerts.length > 0) showDetails(alerts[0]);
      else {
        details.classList.add("hidden");
        details.innerHTML = "";
      }
    } catch (e) {
      console.error("❌ Failed to load alerts:", e);
      tbody.innerHTML = `<tr><td colspan="5">Failed to load alerts.</td></tr>`;
    }
  }

  // Run analysis
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

  // Refresh
  document.getElementById("refresh").onclick = async () => {
    const btn = document.getElementById("refresh");
    btn.disabled = true;
    btn.textContent = "Refreshing...";
    await load();
    btn.textContent = "Refresh";
    btn.disabled = false;
  };

  // Ask the Compliance Brain
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
      document.getElementById("answerBox").textContent =
        data.answer || "No answer returned.";
    } catch (e) {
      console.error("❌ Ask failed:", e);
      document.getElementById("answerBox").textContent =
        "Error contacting compliance engine.";
    }
  };

  // If filters exist, reload on change (safe if not present)
  if (statusFilter) statusFilter.addEventListener("change", load);
  if (ownerFilter) ownerFilter.addEventListener("change", load);
  if (jurisdictionFilter) jurisdictionFilter.addEventListener("change", load);

  load();
});
