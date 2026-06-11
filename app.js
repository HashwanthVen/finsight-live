/* FinSight Live — dashboard behavior
   Vanilla JS, no build step. Reads from window.FINSIGHT_DATA (data.js). */
(function () {
  "use strict";

  const D = window.FINSIGHT_DATA;
  if (!D) {
    console.error("FinSight: data not loaded");
    return;
  }

  /* ---------- KPI CARDS ---------- */
  function renderKpis() {
    const grid = document.getElementById("kpi-grid");
    if (!grid) return;
    grid.innerHTML = D.kpis.map((k) => {
      const arrow = k.direction === "up" ? "▲" : k.direction === "down" ? "▼" : "▬";
      return `
        <article class="kpi-card kpi-${k.tone}">
          <div class="kpi-label">${escapeHtml(k.label)}</div>
          <div class="kpi-value">${escapeHtml(k.value)}</div>
          <div class="kpi-delta ${k.direction}">${arrow} ${escapeHtml(k.delta)}</div>
          <div class="kpi-note">${escapeHtml(k.note)}</div>
        </article>`;
    }).join("");
  }

  /* ---------- TREND CHART ---------- */
  let currentSeries = "revenue";
  function renderChart(series) {
    const chart = document.getElementById("chart");
    const axis = document.getElementById("chart-axis");
    if (!chart || !axis) return;
    const values = D.trend[series];
    const months = D.trend.months;
    const meta = D.trendSeries[series];
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = Math.max(max - min, 1);

    chart.setAttribute("aria-label", `${meta.label} monthly trend chart`);
    chart.innerHTML = values.map((v) => {
      const pct = 20 + ((v - min) / range) * 75;
      const display = `${meta.prefix}${v}${meta.suffix === "M" ? "M" : meta.suffix}`;
      return `
        <div class="bar-wrap">
          <span class="bar-value">${display}</span>
          <div class="bar" style="height:${pct.toFixed(1)}%"></div>
        </div>`;
    }).join("");
    axis.innerHTML = months.map((m) => `<div class="axis-label">${m}</div>`).join("");
  }

  function bindToggle() {
    document.querySelectorAll(".toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".toggle").forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
        currentSeries = btn.dataset.series;
        renderChart(currentSeries);
      });
    });
  }

  /* ---------- REGION TABLE ---------- */
  function renderRegions(rows) {
    const tbody = document.getElementById("region-tbody");
    if (!tbody) return;
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:30px;">No regions match your filters.</td></tr>`;
      return;
    }
    tbody.innerHTML = rows.map((r) => {
      const cls = r.status.toLowerCase().replace(/\s+/g, "-");
      return `
        <tr>
          <td><strong>${escapeHtml(r.name)}</strong></td>
          <td>${escapeHtml(r.revenue)}</td>
          <td>${escapeHtml(r.growth)}</td>
          <td>${escapeHtml(r.margin)}</td>
          <td>${escapeHtml(r.forecast)}</td>
          <td><span class="status-pill ${cls}">${escapeHtml(r.status)}</span></td>
        </tr>`;
    }).join("");
  }

  function applyRegionFilters() {
    const q = (document.getElementById("region-search").value || "").toLowerCase().trim();
    const status = document.getElementById("region-status").value;
    const rows = D.regions.filter((r) => {
      const matchQ = !q || r.name.toLowerCase().includes(q);
      const matchS = status === "all" || r.status === status;
      return matchQ && matchS;
    });
    renderRegions(rows);
  }

  function bindRegionFilters() {
    const search = document.getElementById("region-search");
    const status = document.getElementById("region-status");
    if (search) search.addEventListener("input", applyRegionFilters);
    if (status) status.addEventListener("change", applyRegionFilters);
  }

  /* ---------- PRODUCT CARDS ---------- */
  function renderProducts() {
    const grid = document.getElementById("product-grid");
    if (!grid) return;
    grid.innerHTML = D.products.map((p) => `
      <article class="product-card">
        <h4>${escapeHtml(p.name)}</h4>
        <div class="product-row"><span class="label">Revenue</span><span class="value">${escapeHtml(p.revenue)}</span></div>
        <div class="product-row"><span class="label">Growth</span><span class="value">${escapeHtml(p.growth)}</span></div>
        <div class="product-row"><span class="label">Adoption Index</span><span class="value">${p.adoption}</span></div>
        <div class="progress" aria-label="Adoption ${p.adoption} percent"><span style="width:${p.adoption}%"></span></div>
      </article>
    `).join("");
  }

  /* ---------- RISK PANEL ---------- */
  function renderRisks() {
    const list = document.getElementById("risk-list");
    if (!list) return;
    list.innerHTML = D.risks.map((r, i) => `
      <li class="risk-item" data-idx="${i}">
        <span class="sev ${r.severity.toLowerCase()}">${r.severity}</span>
        <span class="risk-text">${escapeHtml(r.text)}</span>
        <button class="btn btn-ghost btn-sm review-btn" aria-label="Mark risk reviewed">Mark reviewed</button>
      </li>
    `).join("");
    list.querySelectorAll(".review-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const li = e.target.closest(".risk-item");
        if (!li) return;
        const isReviewed = li.classList.toggle("reviewed");
        btn.textContent = isReviewed ? "Reopen" : "Mark reviewed";
      });
    });
  }

  /* ---------- INSIGHTS ---------- */
  let insightIdx = 0;
  function renderInsight() {
    const card = document.getElementById("insight-card");
    if (!card) return;
    const list = D.insights[insightIdx % D.insights.length];
    card.innerHTML = `<ul>${list.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`;
  }
  function bindRegen() {
    const btn = document.getElementById("regen-insight");
    if (!btn) return;
    btn.addEventListener("click", () => {
      insightIdx = (insightIdx + 1) % D.insights.length;
      renderInsight();
    });
  }

  /* ---------- UTILS ---------- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  /* ---------- INIT ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    renderKpis();
    renderChart(currentSeries);
    bindToggle();
    renderRegions(D.regions);
    bindRegionFilters();
    renderProducts();
    renderRisks();
    renderInsight();
    bindRegen();
  });
})();
