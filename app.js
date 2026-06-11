/* FinSight Live — terminal dashboard behavior */
(function () {
  "use strict";
  const D = window.FINSIGHT_DATA;
  if (!D) { console.error("FinSight: data not loaded"); return; }

  /* ---------- TICKER ---------- */
  function renderTicker() {
    const track = $("ticker-track");
    if (!track) return;
    // Duplicate items so the marquee loops seamlessly
    const html = (D.ticker.concat(D.ticker)).map((t) => {
      const up = !t.chg.startsWith("-");
      const arrow = up ? "▲" : "▼";
      return `<span class="ticker-item">
        <span class="sym">${escapeHtml(t.sym)}</span>
        <span class="val">${escapeHtml(t.val)}</span>
        <span class="chg ${up ? "up" : "down"}">${arrow} ${escapeHtml(t.chg)}</span>
        <span class="sep">·</span>
      </span>`;
    }).join("");
    track.innerHTML = html;
  }

  /* ---------- CLOCK ---------- */
  function tickClock() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const t = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const c1 = $("clock"); if (c1) c1.textContent = t;
    const c2 = $("clock2"); if (c2) c2.textContent = t;
  }

  /* ---------- KPI ---------- */
  function renderKpis() {
    const grid = $("kpi-grid");
    if (!grid) return;
    grid.innerHTML = D.kpis.map((k) => {
      const arrow = k.direction === "up" ? "▲" : k.direction === "down" ? "▼" : "▬";
      return `
        <div class="kpi ${k.tone}">
          <div class="k-label"><span>${escapeHtml(k.label)}</span><span class="badge">LIVE</span></div>
          <div class="k-value">${escapeHtml(k.value)}</div>
          <div class="k-delta ${k.direction}">${arrow} ${escapeHtml(k.delta)}</div>
          <div class="k-note">${escapeHtml(k.note)}</div>
        </div>`;
    }).join("");
    const stamp = $("kpi-stamp");
    if (stamp) {
      const d = new Date();
      stamp.textContent = "LAST UPD " + d.toISOString().slice(11, 19) + "Z";
    }
  }

  /* ---------- SVG LINE CHART ---------- */
  let currentSeries = "revenue";
  function renderChart(series) {
    const svg = $("chart-svg");
    const stat = $("chart-stat");
    if (!svg) return;
    const meta = D.trendSeries[series];
    const values = D.trend[series];
    const months = D.trend.months;

    const W = 600, H = 240;
    const PADL = 40, PADR = 14, PADT = 18, PADB = 26;
    const innerW = W - PADL - PADR;
    const innerH = H - PADT - PADB;

    const max = Math.max(...values);
    const min = Math.min(...values);
    const pad = (max - min) * 0.2 || 1;
    const yMax = max + pad;
    const yMin = Math.max(0, min - pad);
    const yRange = yMax - yMin || 1;

    const points = values.map((v, i) => {
      const x = PADL + (i / (values.length - 1)) * innerW;
      const y = PADT + innerH - ((v - yMin) / yRange) * innerH;
      return { x, y, v };
    });

    // grid lines (5 horizontal)
    const gridLines = [];
    for (let i = 0; i <= 4; i++) {
      const y = PADT + (i / 4) * innerH;
      const val = yMax - (i / 4) * yRange;
      gridLines.push(`<line x1="${PADL}" y1="${y}" x2="${W - PADR}" y2="${y}"/>`);
      gridLines.push(`<text x="${PADL - 6}" y="${y + 3}" text-anchor="end">${val.toFixed(1)}</text>`);
    }

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const areaPath = linePath + ` L${points[points.length - 1].x.toFixed(1)},${PADT + innerH} L${points[0].x.toFixed(1)},${PADT + innerH} Z`;

    const xLabels = months.map((m, i) => {
      const x = PADL + (i / (values.length - 1)) * innerW;
      return `<text x="${x}" y="${H - 8}" text-anchor="middle">${escapeHtml(m)}</text>`;
    }).join("");

    const dots = points.map((p) => `<circle class="chart-dot ${meta.color}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3"/>`).join("");

    svg.innerHTML = `
      <g class="chart-grid">${gridLines.join("")}</g>
      <g class="chart-axis">${xLabels}</g>
      <path class="chart-area ${meta.color}" d="${areaPath}"/>
      <path class="chart-line ${meta.color}" d="${linePath}"/>
      <g>${dots}</g>
    `;

    if (stat) {
      const last = values[values.length - 1];
      const first = values[0];
      const change = (((last - first) / first) * 100).toFixed(1);
      stat.innerHTML = `
        <div><span>SERIES</span><b>${meta.label}</b></div>
        <div><span>HI</span><b>${max.toFixed(1)}</b></div>
        <div><span>LO</span><b>${min.toFixed(1)}</b></div>
        <div><span>Δ</span><b class="${change >= 0 ? "green" : "red"}">${change >= 0 ? "+" : ""}${change}%</b></div>
      `;
    }
  }

  function bindToggle() {
    document.querySelectorAll(".toggle").forEach((btn) => {
      btn.addEventListener("click", () => setSeries(btn.dataset.series));
    });
  }
  function setSeries(s) {
    if (!D.trend[s]) return;
    currentSeries = s;
    document.querySelectorAll(".toggle").forEach((b) => {
      const active = b.dataset.series === s;
      b.classList.toggle("active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });
    renderChart(s);
  }

  /* ---------- REGIONS ---------- */
  function renderRegions(rows) {
    const tbody = $("region-tbody");
    if (!tbody) return;
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--dim);padding:18px;">NO MATCHING REGIONS</td></tr>`;
      return;
    }
    tbody.innerHTML = rows.map((r) => {
      const cls = r.status.toLowerCase().replace(/\s+/g, "-");
      const growthPositive = r.growth.startsWith("+");
      return `
        <tr>
          <td><b class="amber">${escapeHtml(r.name)}</b></td>
          <td class="num">${escapeHtml(r.revenue)}</td>
          <td class="num ${growthPositive ? "green" : "red"}">${escapeHtml(r.growth)}</td>
          <td class="num">${escapeHtml(r.margin)}</td>
          <td class="num">${escapeHtml(r.forecast)}</td>
          <td><span class="status-pill ${cls}">${escapeHtml(r.status)}</span></td>
        </tr>`;
    }).join("");
  }

  function applyRegionFilters() {
    const q = ($("region-search").value || "").toLowerCase().trim();
    const status = $("region-status").value;
    const rows = D.regions.filter((r) => {
      const matchQ = !q || r.name.toLowerCase().includes(q);
      const matchS = status === "all" || r.status === status;
      return matchQ && matchS;
    });
    renderRegions(rows);
  }
  function bindRegionFilters() {
    const s = $("region-search"); if (s) s.addEventListener("input", applyRegionFilters);
    const t = $("region-status"); if (t) t.addEventListener("change", applyRegionFilters);
  }

  /* ---------- PRODUCTS ---------- */
  function renderProducts() {
    const grid = $("prod-grid");
    if (!grid) return;
    grid.innerHTML = D.products.map((p) => `
      <div class="prod">
        <h4>${escapeHtml(p.name)}</h4>
        <div class="row"><span class="l">REV</span><span class="v">${escapeHtml(p.revenue)}</span></div>
        <div class="row"><span class="l">GROWTH</span><span class="v green">${escapeHtml(p.growth)}</span></div>
        <div class="row"><span class="l">ADOPT</span><span class="v">${p.adoption}</span></div>
        <div class="bar" aria-label="Adoption ${p.adoption} percent"><span style="width:${p.adoption}%"></span></div>
      </div>
    `).join("");
  }

  /* ---------- RISKS ---------- */
  function renderRisks() {
    const list = $("risk-list");
    const count = $("risk-count");
    if (!list) return;
    list.innerHTML = D.risks.map((r, i) => `
      <li class="risk-item" data-idx="${i}">
        <span class="sev ${r.severity.toLowerCase()}">${r.severity}</span>
        <span class="risk-text">${escapeHtml(r.text)}</span>
        <button class="btn sm review-btn">MARK REVIEWED</button>
      </li>
    `).join("");
    if (count) count.textContent = D.risks.length + " ACTIVE";
    list.querySelectorAll(".review-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const li = e.target.closest(".risk-item");
        if (!li) return;
        const reviewed = li.classList.toggle("reviewed");
        btn.textContent = reviewed ? "REOPEN" : "MARK REVIEWED";
      });
    });
  }

  /* ---------- INSIGHTS ---------- */
  let insightIdx = 0;
  function renderInsight() {
    const list = $("insight-list");
    if (!list) return;
    const items = D.insights[insightIdx % D.insights.length];
    list.innerHTML = items.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  }
  function bindRegen() {
    const btn = $("regen-insight");
    if (!btn) return;
    btn.addEventListener("click", () => {
      insightIdx = (insightIdx + 1) % D.insights.length;
      renderInsight();
    });
  }

  /* ---------- COMMAND BAR ---------- */
  function bindCommand() {
    const inp = $("cmd");
    if (!inp) return;
    inp.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const raw = inp.value.trim();
      if (!raw) return;
      const cmd = raw.toUpperCase();
      e.preventDefault();
      runCommand(cmd);
      inp.value = "";
    });
  }
  function runCommand(cmd) {
    if (cmd === "HELP") {
      flash("CMDS: GO DASH | GO KPIS | GO TREND | GO REGIONS | GO PRODUCTS | GO RISKS | GO INSIGHTS | GO REQUESTS | TREND REV/MGN/PIPE | ROTATE");
      return;
    }
    if (cmd === "GO REQUESTS" || cmd === "REQS") {
      window.location.href = "requests.html"; return;
    }
    const goMap = {
      "GO DASH": "dashboard", "GO KPIS": "dashboard", "GO TREND": "trend",
      "GO REGIONS": "regions", "GO PRODUCTS": "products",
      "GO RISKS": "risks", "GO INSIGHTS": "insights", "GO NOTES": "release"
    };
    if (goMap[cmd]) {
      const el = document.getElementById(goMap[cmd]);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (cmd === "TREND REV" || cmd === "TREND REVENUE")  { setSeries("revenue"); return; }
    if (cmd === "TREND MGN" || cmd === "TREND MARGIN")   { setSeries("margin"); return; }
    if (cmd === "TREND PIPE" || cmd === "TREND PIPELINE"){ setSeries("pipeline"); return; }
    if (cmd === "ROTATE") {
      insightIdx = (insightIdx + 1) % D.insights.length; renderInsight();
      return;
    }
    flash(`UNKNOWN CMD: ${cmd} · type HELP`, "err");
  }

  /* ---------- TOAST ---------- */
  function flash(msg, kind) {
    const t = document.createElement("div");
    t.className = "toast" + (kind ? " " + kind : "");
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2400);
  }

  /* ---------- UTILS ---------- */
  function $(id) { return document.getElementById(id); }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  /* ---------- INIT ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    renderTicker();
    tickClock(); setInterval(tickClock, 1000);
    renderKpis();
    renderChart(currentSeries);
    bindToggle();
    renderRegions(D.regions);
    bindRegionFilters();
    renderProducts();
    renderRisks();
    renderInsight();
    bindRegen();
    bindCommand();
  });
})();
