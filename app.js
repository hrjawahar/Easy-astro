(function () {
  const { SIGNS, PLANETS, HOUSE_TOPICS, analyze, renderReference } = window.AstrologyEngine;
  const STORAGE_KEY = "d1d9InsightMapper.sessions";

  const els = {
    tabs: [...document.querySelectorAll(".tab")],
    panels: [...document.querySelectorAll(".tab-panel")],
    d1Lagna: document.getElementById("d1Lagna"),
    d9Lagna: document.getElementById("d9Lagna"),
    d1Grid: document.getElementById("d1Grid"),
    d9Grid: document.getElementById("d9Grid"),
    analyzeBtn: document.getElementById("analyzeBtn"),
    clearBtn: document.getElementById("clearBtn"),
    sampleBtn: document.getElementById("sampleBtn"),
    saveBtn: document.getElementById("saveBtn"),
    downloadBtn: document.getElementById("downloadBtn"),
    refreshHistoryBtn: document.getElementById("refreshHistoryBtn"),
    resultsRoot: document.getElementById("resultsRoot"),
    historyRoot: document.getElementById("historyRoot"),
    referenceRoot: document.getElementById("referenceRoot"),
    nativeName: document.getElementById("nativeName"),
    notes: document.getElementById("notes")
  };

  let lastAnalysis = null;

  function buildSelectOptions(select) {
    select.innerHTML = SIGNS.map(s => `<option value="${s}">${s}</option>`).join("");
  }

  function houseCardHTML(prefix, house) {
    return `
      <div class="house-card" data-chart="${prefix}" data-house="${house}">
        <h3>House ${house}</h3>
        <div class="muted">${HOUSE_TOPICS[house]}</div>
        <div class="planets-list">
          ${PLANETS.map(planet => `
            <label class="checkbox">
              <input type="checkbox" data-chart="${prefix}" data-house="${house}" data-planet="${planet}">
              <span>${planet}</span>
            </label>
          `).join("")}
        </div>
      </div>
    `;
  }

  function buildGrid(root, prefix) {
    root.innerHTML = Array.from({ length: 12 }, (_, i) => houseCardHTML(prefix, i + 1)).join("");
  }

  function activateTabs() {
    els.tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const key = tab.dataset.tab;
        els.tabs.forEach(t => t.classList.toggle("active", t === tab));
        els.panels.forEach(p => p.classList.toggle("active", p.id === key));
        if (key === "history") renderHistory();
      });
    });
  }

  function readChart(prefix) {
    const lagnaSign = document.getElementById(`${prefix}Lagna`).value;
    const houses = {};
    for (let h = 1; h <= 12; h++) {
      houses[h] = [...document.querySelectorAll(`input[data-chart="${prefix}"][data-house="${h}"]:checked`)]
        .map(cb => cb.dataset.planet);
    }
    return { lagnaSign, houses };
  }

  function currentPayload() {
    return {
      name: els.nativeName.value.trim() || "Untitled Native",
      notes: els.notes.value.trim(),
      d1: readChart("d1"),
      d9: readChart("d9")
    };
  }

  function applyChart(prefix, chart) {
    document.getElementById(`${prefix}Lagna`).value = chart.lagnaSign;
    for (let h = 1; h <= 12; h++) {
      const selected = new Set(chart.houses[h] || []);
      document.querySelectorAll(`input[data-chart="${prefix}"][data-house="${h}"]`).forEach(cb => {
        cb.checked = selected.has(cb.dataset.planet);
      });
    }
  }

  function renderResultTable(rows) {
    return `
      <table class="summary-table">
        <thead>
          <tr>
            <th>House</th>
            <th>Significance</th>
            <th>D1</th>
            <th>D9</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${r.house}</td>
              <td>${r.significance}</td>
              <td>${r.d1}</td>
              <td>${r.d9}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  function renderAnalysis(result, payload) {
    const areaCards = Object.entries(result.areas).map(([key, area]) => `
      <section class="card result-block">
        <h2>${titleCase(key)}</h2>
        <p>${area.narrative}</p>
        <div class="pill-row">
          <span class="pill ${area.d1Strength.score >= 2 ? "good" : area.d1Strength.score < 0 ? "danger" : "warn"}">
            D1 ${area.d1Strength.label}: ${area.d1Strength.notes.join(", ") || "no major modifiers captured"}
          </span>
          <span class="pill ${area.d9Strength.score >= 2 ? "good" : area.d9Strength.score < 0 ? "danger" : "warn"}">
            D9 ${area.d9Strength.label}: ${area.d9Strength.notes.join(", ") || "no major modifiers captured"}
          </span>
        </div>
        <div style="margin-top:12px">${renderResultTable(area.rows)}</div>
      </section>
    `).join("");

    const foreignBlock = `
      <section class="card result-block">
        <h2>Foreign Travel / Stay / Settlement</h2>
        <div class="pill-row">
          <span class="pill ${result.foreign.verdict === "Strong chance" ? "good" : result.foreign.verdict === "Possible" ? "warn" : "danger"}">
            Verdict: ${result.foreign.verdict}
          </span>
          <span class="pill">Score: ${result.foreign.score}</span>
        </div>
        <p style="margin-top:12px">${result.foreign.summary}</p>
        <ul class="compact">
          ${result.foreign.indicators.map(i => `<li>${i}</li>`).join("") || "<li>No major rule triggers captured.</li>"}
        </ul>
      </section>
    `;

    const mahaBlock = `
      <section class="card result-block">
        <h2>Mahadasha Watch Zones</h2>
        <p>These flags highlight significators that should be handled carefully when their mahadasha periods run. This version does not compute dates or timeline lengths.</p>
        ${
          result.maha.length
          ? `<table class="summary-table">
              <thead>
                <tr>
                  <th>Planet</th>
                  <th>Area</th>
                  <th>Why watch it</th>
                </tr>
              </thead>
              <tbody>
                ${result.maha.map(item => `
                  <tr>
                    <td>${item.planet}</td>
                    <td>${item.area}</td>
                    <td>${item.line}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>`
          : `<div class="pill good">No major caution flags were triggered by the current rule set.</div>`
        }
      </section>
    `;

    els.resultsRoot.innerHTML = `
      <section class="card result-block">
        <h2>Report Summary</h2>
        <div class="pill-row">
          ${result.headline.map(h => `<span class="pill">${h}</span>`).join("")}
        </div>
        <p style="margin-top:12px"><strong>Native:</strong> ${escapeHtml(payload.name)}</p>
        ${payload.notes ? `<p><strong>Notes:</strong> ${escapeHtml(payload.notes)}</p>` : ""}
        <p class="muted">Generated from manual D1/D9 inputs using a browser-based rule engine. Version: ${result.meta.version}</p>
      </section>
      ${areaCards}
      ${foreignBlock}
      ${mahaBlock}
    `;
  }

  function titleCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHtml(v) {
    return v.replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
  }

  function loadReference() {
    const ref = renderReference();
    els.referenceRoot.innerHTML = `
      <h3>12 Houses – Quick Reference</h3>
      <table class="reference-table">
        <thead><tr><th>House</th><th>Meaning</th></tr></thead>
        <tbody>
          ${Object.entries(ref.houseTopics).map(([h, t]) => `<tr><td>${h}</td><td>${t}</td></tr>`).join("")}
        </tbody>
      </table>

      <h3>Sign Lords</h3>
      <table class="reference-table">
        <thead><tr><th>Sign</th><th>Lord</th></tr></thead>
        <tbody>
          ${Object.entries(ref.signLord).map(([s, l]) => `<tr><td>${s}</td><td>${l}</td></tr>`).join("")}
        </tbody>
      </table>

      <h3>Exaltation and Debilitation</h3>
      <table class="reference-table">
        <thead><tr><th>Planet</th><th>Exaltation</th><th>Debilitation</th></tr></thead>
        <tbody>
          ${ref.planets.map(p => `<tr><td>${p}</td><td>${ref.exaltation[p] || "-"}</td><td>${ref.debilitation[p] || "-"}</td></tr>`).join("")}
        </tbody>
      </table>
    `;
  }

  function getSessions() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function setSessions(sessions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }

  function saveCurrent() {
    const payload = currentPayload();
    const result = analyze(payload);
    lastAnalysis = { payload, result };
    const sessions = getSessions();
    sessions.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      savedAt: new Date().toISOString(),
      payload
    });
    setSessions(sessions.slice(0, 30));
    renderHistory();
    renderAnalysis(result, payload);
    alert("Session saved.");
  }

  function renderHistory() {
    const sessions = getSessions();
    if (!sessions.length) {
      els.historyRoot.innerHTML = `<div class="muted">No saved sessions yet.</div>`;
      return;
    }
    els.historyRoot.innerHTML = sessions.map(item => `
      <div class="history-item">
        <div class="history-meta">
          <h3>${escapeHtml(item.payload.name || "Untitled Native")}</h3>
          <div class="muted">${new Date(item.savedAt).toLocaleString()}</div>
          <div class="muted">D1 Lagna: ${item.payload.d1.lagnaSign} | D9 Lagna: ${item.payload.d9.lagnaSign}</div>
        </div>
        <div class="history-actions">
          <button class="btn secondary" data-load="${item.id}">Load</button>
          <button class="btn ghost" data-delete="${item.id}">Delete</button>
        </div>
      </div>
    `).join("");

    els.historyRoot.querySelectorAll("[data-load]").forEach(btn => {
      btn.addEventListener("click", () => {
        const item = sessions.find(s => s.id === btn.dataset.load);
        if (!item) return;
        els.nativeName.value = item.payload.name || "";
        els.notes.value = item.payload.notes || "";
        applyChart("d1", item.payload.d1);
        applyChart("d9", item.payload.d9);
        const result = analyze(item.payload);
        lastAnalysis = { payload: item.payload, result };
        renderAnalysis(result, item.payload);
        openTab("analysis");
      });
    });

    els.historyRoot.querySelectorAll("[data-delete]").forEach(btn => {
      btn.addEventListener("click", () => {
        const filtered = sessions.filter(s => s.id !== btn.dataset.delete);
        setSessions(filtered);
        renderHistory();
      });
    });
  }

  function openTab(id) {
    els.tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === id));
    els.panels.forEach(p => p.classList.toggle("active", p.id === id));
  }

  function clearAll() {
    els.nativeName.value = "";
    els.notes.value = "";
    els.d1Lagna.value = "Aries";
    els.d9Lagna.value = "Aries";
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    els.resultsRoot.innerHTML = "";
    lastAnalysis = null;
  }

  function loadSample() {
    const sample = {
      name: "Sample Native",
      notes: "Demonstration dataset",
      d1: {
        lagnaSign: "Aquarius",
        houses: {
          1: [], 2: [], 3: ["Moon"], 4: ["Rahu"], 5: [], 6: [],
          7: ["Mercury","Venus","Mars"], 8: [], 9: [], 10: [],
          11: ["Sun"], 12: ["Saturn","Ketu","Jupiter"]
        }
      },
      d9: {
        lagnaSign: "Libra",
        houses: {
          1: [], 2: [], 3: [], 4: ["Moon"], 5: [], 6: ["Saturn"],
          7: ["Venus","Mercury"], 8: [], 9: ["Jupiter"], 10: ["Sun","Mars"],
          11: ["Rahu"], 12: ["Ketu"]
        }
      }
    };
    els.nativeName.value = sample.name;
    els.notes.value = sample.notes;
    applyChart("d1", sample.d1);
    applyChart("d9", sample.d9);
    const result = analyze(sample);
    lastAnalysis = { payload: sample, result };
    renderAnalysis(result, sample);
  }

  function downloadReport() {
    if (!lastAnalysis) {
      const payload = currentPayload();
      lastAnalysis = { payload, result: analyze(payload) };
    }
    const { payload, result } = lastAnalysis;
    const html = `
      <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Report</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.45; margin: 24px; color: #111; }
        h1, h2, h3 { margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0 18px; }
        th, td { border: 1px solid #bbb; padding: 8px; text-align: left; vertical-align: top; }
        .muted { color: #555; }
      </style></head><body>
      <h1>D1–D9 Insight Mapper Report</h1>
      <p><strong>Native:</strong> ${escapeHtml(payload.name)}</p>
      ${payload.notes ? `<p><strong>Notes:</strong> ${escapeHtml(payload.notes)}</p>` : ""}
      <p class="muted">Generated: ${new Date(result.generatedAt).toLocaleString()}</p>
      <h2>Headline Summary</h2>
      <ul>${result.headline.map(h => `<li>${h}</li>`).join("")}</ul>
      ${Object.entries(result.areas).map(([key, area]) => `
        <h2>${titleCase(key)}</h2>
        <p>${area.narrative}</p>
        <p><strong>D1:</strong> ${area.d1Strength.label} (${area.d1Strength.notes.join(", ") || "no major modifiers"})</p>
        <p><strong>D9:</strong> ${area.d9Strength.label} (${area.d9Strength.notes.join(", ") || "no major modifiers"})</p>
        ${renderResultTable(area.rows)}
      `).join("")}
      <h2>Foreign Travel / Stay / Settlement</h2>
      <p><strong>Verdict:</strong> ${result.foreign.verdict}</p>
      <p>${result.foreign.summary}</p>
      <ul>${result.foreign.indicators.map(i => `<li>${i}</li>`).join("")}</ul>
      <h2>Mahadasha Watch Zones</h2>
      ${result.maha.length ? `
        <ul>${result.maha.map(m => `<li><strong>${m.planet}</strong> – ${m.line}</li>`).join("")}</ul>
      ` : `<p>No major caution flags were triggered by the current rule set.</p>`}
      </body></html>
    `;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${slugify(payload.name || "d1-d9-report")}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function slugify(v) {
    return v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function initEvents() {
    els.analyzeBtn.addEventListener("click", () => {
      const payload = currentPayload();
      const result = analyze(payload);
      lastAnalysis = { payload, result };
      renderAnalysis(result, payload);
    });
    els.clearBtn.addEventListener("click", clearAll);
    els.sampleBtn.addEventListener("click", loadSample);
    els.saveBtn.addEventListener("click", saveCurrent);
    els.downloadBtn.addEventListener("click", downloadReport);
    els.refreshHistoryBtn.addEventListener("click", renderHistory);
  }

  function init() {
    buildSelectOptions(els.d1Lagna);
    buildSelectOptions(els.d9Lagna);
    els.d1Lagna.value = "Aries";
    els.d9Lagna.value = "Aries";
    buildGrid(els.d1Grid, "d1");
    buildGrid(els.d9Grid, "d9");
    activateTabs();
    loadReference();
    renderHistory();
    initEvents();
  }

  init();
})();
