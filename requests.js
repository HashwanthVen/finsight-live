/* FinSight Live — Request Center (v0.4, simplified)
   - 3-field mobile-first form
   - Submit behavior, in order of preference:
       1. Cloudflare Worker (true one-tap, no audience login) if WORKER_URL set
       2. Prefilled GitHub new-issue page (works for anyone with a GH account)
   - Reads feature-requests.md to show a live "audience requests" feed */
(function () {
  "use strict";

  // ---- CONFIG -----------------------------------------------------------------
  const GITHUB_OWNER = "HashwanthVen";
  const GITHUB_REPO  = "finsight-live";
  // Hard-code the Worker URL here once you deploy worker/ (see worker/README.md):
  //   const WORKER_URL = "https://finsight-relay.your-subdomain.workers.dev";
  const WORKER_URL_DEFAULT = "";
  const WORKER_KEY = "finsight.worker_url.v1";
  // -----------------------------------------------------------------------------

  function $(id) { return document.getElementById(id); }
  function workerUrl() {
    try { return (localStorage.getItem(WORKER_KEY) || WORKER_URL_DEFAULT || "").trim(); }
    catch (e) { return WORKER_URL_DEFAULT; }
  }

  /* ---------- TICKER (slim, mobile) ---------- */
  function renderTicker() {
    const track = $("ticker-track");
    if (!track || !window.FINSIGHT_DATA) return;
    const t = window.FINSIGHT_DATA.ticker;
    track.innerHTML = (t.concat(t)).map((x) => {
      const up = !x.chg.startsWith("-");
      return `<span class="ticker-item">
        <span class="sym">${esc(x.sym)}</span>
        <span class="val">${esc(x.val)}</span>
        <span class="chg ${up ? "up" : "down"}">${up ? "▲" : "▼"} ${esc(x.chg)}</span>
        <span class="sep">·</span>
      </span>`;
    }).join("");
  }

  /* ---------- FEED ---------- */
  async function loadFeed() {
    const feed = $("feed");
    if (!feed) return;
    try {
      const res = await fetch("feature-requests.md?cb=" + Date.now());
      if (!res.ok) throw new Error("HTTP " + res.status);
      const text = await res.text();
      const rows = parseRequestsTable(text);
      if (rows.length === 0) {
        feed.innerHTML = `<div class="feed-empty">No requests yet. Be the first ▲</div>`;
        return;
      }
      feed.innerHTML = `<ul>` + rows.slice(0, 12).map((r) => `
        <li>
          <span class="tag">${esc(r.type || "REQ")}</span>
          <div>
            <div>${esc(r.title)}</div>
            <span class="feed-meta">${esc(r.when || "")}${r.who ? " · " + esc(r.who) : ""}</span>
          </div>
        </li>`).join("") + `</ul>`;
    } catch (e) {
      feed.innerHTML = `<div class="feed-empty">Feed unavailable.</div>`;
    }
  }

  // Parse the markdown table in feature-requests.md. We expect columns:
  // | When | Type | Title | Who |
  function parseRequestsTable(md) {
    const lines = md.split(/\r?\n/);
    const out = [];
    let inTable = false, headerSeen = false;
    for (const ln of lines) {
      if (!ln.trim().startsWith("|")) { inTable = false; headerSeen = false; continue; }
      if (/^\|\s*-+/.test(ln)) { inTable = true; headerSeen = true; continue; }
      if (!headerSeen) continue;
      if (!inTable) continue;
      // skip header line(s) until separator passed
      const cells = ln.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.length < 3) continue;
      out.push({
        when:  cells[0] || "",
        type:  cells[1] || "",
        title: cells[2] || "",
        who:   cells[3] || ""
      });
    }
    return out.reverse(); // newest first
  }

  /* ---------- SUBMIT ---------- */
  function buildIssueTitle(form) { return `[${form.type}] ${form.title}`; }
  function buildIssueBody(form) {
    const ts = new Date().toISOString();
    return [
      `**Request type:** ${form.type}`,
      "",
      `### What should we build?`,
      form.title,
      "",
      `### Details`,
      form.description || "_(none provided)_",
      "",
      `**Submitted via FinSight Live · ${ts}**`
    ].join("\n");
  }
  function buildIssueUrl(form) {
    const base = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/new`;
    const params = new URLSearchParams({
      title: buildIssueTitle(form),
      body:  buildIssueBody(form),
      labels: ["demo-request", form.type.toLowerCase().replace(/\s+/g, "-")].join(",")
    });
    return `${base}?${params.toString()}`;
  }

  async function submit(e) {
    e.preventDefault();
    const form = {
      title:       $("f-title").value.trim(),
      description: $("f-desc").value.trim(),
      type:        $("f-type").value
    };
    if (!form.title) { showResult("Please enter a title.", "err"); return; }

    const btn = $("btn-submit");
    btn.disabled = true; btn.textContent = "▶ SUBMITTING…";

    const url = workerUrl();
    if (url) {
      // Worker path — true one-tap, no login
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`Worker ${res.status}: ${txt.slice(0, 140)}`);
        }
        const data = await res.json().catch(() => ({}));
        const link = data.issue_url
          ? ` <a href="${esc(data.issue_url)}" target="_blank" rel="noopener">View issue ↗</a>`
          : "";
        showResult(`✓ Submitted! It will appear on the dashboard shortly.${link}`, "good");
        clearForm();
        setTimeout(loadFeed, 2000);
      } catch (err) {
        showResult(`✗ ${err.message}. Falling back to GitHub…`, "err");
        setTimeout(() => window.open(buildIssueUrl(form), "_blank", "noopener"), 800);
      } finally {
        btn.disabled = false; btn.textContent = "▶ SUBMIT";
      }
      return;
    }

    // Fallback: open prefilled GitHub new-issue page
    const ghUrl = buildIssueUrl(form);
    window.open(ghUrl, "_blank", "noopener");
    showResult(`Opened GitHub — tap <b>"Submit new issue"</b> there to post it. Requires a free GitHub account.`, "good");
    btn.disabled = false; btn.textContent = "▶ SUBMIT";
  }

  function clearForm() {
    $("f-title").value = "";
    $("f-desc").value = "";
    $("f-type").selectedIndex = 0;
  }
  function showResult(msg, kind) {
    const el = $("result");
    el.className = "submit-result show " + (kind || "");
    el.innerHTML = msg;
    setTimeout(() => { el.classList.remove("show"); }, 9000);
  }

  /* ---------- PRESENTER DRAWER ---------- */
  function refreshMode() {
    const u = workerUrl();
    const badge = $("mode-badge");
    const text  = $("mode-text");
    if (u) {
      badge.textContent = "ONE-TAP MODE";
      badge.className = "badge good";
      text.textContent = `posts to ${u.replace(/^https?:\/\//, "")}`;
    } else {
      badge.textContent = "DEFAULT MODE";
      badge.className = "badge dim";
      text.textContent = "opens prefilled GitHub issue";
    }
    $("worker-url").value = u;
  }
  function bindDrawer() {
    $("btn-worker-save").addEventListener("click", () => {
      const v = $("worker-url").value.trim();
      try {
        if (v) localStorage.setItem(WORKER_KEY, v);
        else localStorage.removeItem(WORKER_KEY);
      } catch (e) {}
      refreshMode();
      showResult(v ? "✓ Worker URL saved on this device." : "Worker URL cleared.", "good");
    });
    $("btn-worker-clear").addEventListener("click", () => {
      try { localStorage.removeItem(WORKER_KEY); } catch (e) {}
      refreshMode();
    });
  }

  /* ---------- UTILS ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  /* ---------- INIT ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    renderTicker();
    loadFeed();
    refreshMode();
    bindDrawer();
    $("req-form").addEventListener("submit", submit);
  });
})();
