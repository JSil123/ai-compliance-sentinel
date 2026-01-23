async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {})
  });
  return res.json();
}

async function getJSON(url) {
  const res = await fetch(url);
  return res.json();
}

function qs(id) { return document.getElementById(id); }

function renderCitations(citations) {
  if (!citations || citations.length === 0) return "";
  return citations.map(c => {
    if (c.type === "law") {
      return `<li><b>Law:</b> ${c.title} (${c.jurisdiction || ""}) — <a href="${c.url}" target="_blank">source</a> ${c.requirement ? `(${c.requirement})` : ""}</li>`;
    }
    if (c.type === "policy") {
      return `<li><b>Policy:</b> ${c.title} — Control: ${c.control} (v${c.version})</li>`;
    }
    if (c.type === "artifact") {
      return `<li><b>Artifact:</b> ${c.title} (${c.region}) last updated ${c.last_updated}</li>`;
    }
    if (c.type === "policy_control") {
      return `<li><b>Policy Control Match:</b> ${c.title} — ${c.control} (match ${c.match}%)</li>`;
    }
    return `<li>${JSON.stringify(c)}</li>`;
  }).join("");
}

async function loadAlerts() {
  const status = qs("statusFilter").value;
  const owner = qs("ownerFilter").value;
  const jurisdiction = qs("jurisdictionFilter").value;

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (owner) params.set("owner", owner);
  if (jurisdiction) params.set("jurisdiction", jurisdiction);

  const alerts = await getJSON(`/api/alerts?${params.toString()}`);

  const tbody = qs("alertsTable").querySelector("tbody");
  tbody.innerHTML = "";

  alerts.forEach(a => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(a.created_at).toLocaleString()}</td>
      <td>${a.recommended_owner}</td>
      <td>${a.jurisdiction}</td>
      <td>${a.severity}</td>
      <td>${a.risk_score}</td>
      <td class="titleCell">${a.title}</td>
      <td>${a.status}</td>
    `;
    tr.addEventListener("click", () => showAlertDetails(a));
    tbody.appendChild(tr);
  });
}

function showAlertDetails(a) {
  const div = qs("alertDetails");
  div.classList.remove("hidden");
  div.innerHTML = `
    <h3>Alert Details</h3>
    <p><b>Type:</b> ${a.alert_type}</p>
    <p><b>Owner:</b> ${a.recommended_owner}</p>
    <p><b>Description:</b> ${a.description}</p>
    <h4>Citations</h4>
    <ul>${renderCitations(a.citations)}</ul>
  `;
}

async function runAnalysis() {
  qs("runAnalysis").disabled = true;
  qs("runAnalysis").innerText = "Running...";
  await postJSON("/api/analyze", {});
  await loadAlerts();
  qs("runAnalysis").innerText = "Run Compliance Analysis";
  qs("runAnalysis").disabled = false;
}

async function ask() {
  const question = qs("question").value.trim();
  if (!question) return;

  qs("answerBox").textContent = "Thinking...";
  qs("citationsBox").innerHTML = "";

  const data = await postJSON("/api/ask", { question });
  qs("answerBox").textContent = data.answer || "No answer.";
  qs("citationsBox").innerHTML = data.citations?.length
    ? `<h4>Citations</h4><ul>${renderCitations(data.citations)}</ul>`
    : "";
}

qs("runAnalysis").addEventListener("click", runAnalysis);
qs("refresh").addEventListener("click", loadAlerts);
qs("askBtn").addEventListener("click", ask);

// Initial load
loadAlerts();
