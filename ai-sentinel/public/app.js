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

alerts.forEach(alert => {
  let title = alert.title || "Untitled Alert";

  // 👇 PUT YOUR CODE HERE
  if (title.includes("New Regulation")) {
    title = "🆕 " + title;
  }
details.innerHTML = `
  <p><strong>Alert Classification:</strong> Regulatory Compliance Risk</p>
  <p><strong>Responsible Function:</strong> ${alert.owner}</p>
  <p><strong>Summary:</strong> ${alert.description || 
    "This alert was generated following an automated compliance assessment. Immediate review is recommended."}</p>
  <p><strong>Regulatory Basis:</strong></p>
  <ul>
    ${alert.citations.map(c =>
      `<li>${c.law} — ${c.article}</li>`
    ).join("")}
  </ul>
`;

  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${alert.created_at}</td>
    <td>${alert.owner}</td>
    <td>${alert.jurisdiction}</td>
    <td>${alert.severity}</td>
    <td>${alert.risk || "—"}</td>
    <td><strong>${title}</strong></td>
    <td>${alert.status}</td>
  `;

  tableBody.appendChild(row);
});


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
