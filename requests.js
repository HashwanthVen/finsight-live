/* FinSight Live — Request Center
   - localStorage queue (works offline, no login)
   - mailto: fallback (always works)
   - GitHub prefilled URL (no login → falls back to copyable body)
   - Optional PRESENTER TOKEN MODE: auto-creates issues via GitHub REST API
     using a fine-grained PAT pasted ONCE on the presenter's device. The token
     is stored only in this browser's localStorage. */
(function () {
  "use strict";

  // ---- CONFIGURE FOR YOUR REPO ------------------------------------------------
  const GITHUB_OWNER = "HashwanthVen";
  const GITHUB_REPO  = "finsight-live";
  // Where mailto fallback sends the request. Update if you want a different inbox.
  const PRESENTER_EMAIL = "HashwanthVen@users.noreply.github.com";
  // -----------------------------------------------------------------------------

  const STORAGE_KEY = "finsight.requests.v1";
  const TOKEN_KEY   = "finsight.gh_token.v1";
  const PLACEHOLDER_OWNER = "REPLACE_WITH_OWNER";
  const PLACEHOLDER_REPO  = "REPLACE_WITH_REPO";

  const SAMPLES = [
    { type: "Feature",   title: "Add dark mode toggle",         priority: "Medium", area: "Dashboard",         sample: true, description: "Add a toggle so the terminal can switch between the current amber-on-black theme and a light theme.", why: "Improves accessibility and viewing comfort in varied lighting.", expected: "A visible toggle persists the chosen theme across reloads." },
    { type: "Feature",   title: "Add forecast variance card",   priority: "High",   area: "Dashboard",         sample: true, description: "Add a KPI tile showing forecast variance vs actual.", why: "Surfaces forecasting accuracy at a glance.", expected: "New KPI tile appears in the KPI desk with delta vs plan." },
    { type: "UI polish", title: "Add chart type switcher",      priority: "Low",    area: "Charts",            sample: true, description: "Allow switching the trend chart between line, area, and bar views.", why: "Different chart types suit different conversations.", expected: "Toggle changes the rendered chart type." },
    { type: "Bug",       title: "Fix mobile KPI overflow",      priority: "High",   area: "Mobile/responsive", sample: true, description: "KPI tiles overflow on very narrow viewports.", why: "Demo on mobile needs to look polished.", expected: "KPI tiles stack and fit within viewport." },
    { type: "Feature",   title: "Add risk heatmap",             priority: "Medium", area: "Risk panel",        sample: true, description: "Render risks as a heatmap by severity and region.", why: "Surfaces concentration patterns quickly.", expected: "New heatmap section appears under the risk list." }
  ];

  /* ---------- CLOCK ---------- */
  function tickClock() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const t = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    setText("clock", t); setText("clock2", t);
  }

  /* ---------- STORAGE ---------- */
  function loadQueue() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function saveQueue(arr) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch (e) {}
  }
  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; }
  }
  function setToken(t) {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
  }

  function ownerRepoConfigured() {
    return GITHUB_OWNER && GITHUB_REPO &&
           GITHUB_OWNER !== PLACEHOLDER_OWNER &&
           GITHUB_REPO  !== PLACEHOLDER_REPO;
  }

  /* ---------- FORM ---------- */
  function readForm() {
    return {
      type:        $("f-type").value,
      title:       $("f-title").value.trim(),
      description: $("f-desc").value.trim(),
      why:         $("f-why").value.trim(),
      priority:    $("f-priority").value,
      area:        $("f-area").value,
      expected:    $("f-expected").value.trim(),
      reporter:    $("f-reporter").value.trim(),
      safe:        $("f-safe").checked
    };
  }
  function validate(form) {
    if (!form.title)       return "TITLE is required.";
    if (!form.description) return "DESCRIPTION is required.";
    if (!form.safe)        return "Confirm this request uses synthetic/demo data only.";
    return null;
  }
  function setError(msg) { $("form-error").textContent = msg || ""; }

  function clearForm() {
    ["f-title", "f-desc", "f-why", "f-expected", "f-reporter"].forEach((id) => { $(id).value = ""; });
    $("f-type").selectedIndex = 0;
    $("f-priority").value = "Medium";
    $("f-area").selectedIndex = 0;
    $("f-safe").checked = false;
    $("issue-output").classList.remove("visible");
    setError("");
  }

  /* ---------- ISSUE PAYLOAD ---------- */
  function buildIssueTitle(form) { return `[${form.type}] ${form.title}`; }

  function buildIssueBody(form) {
    const ts = new Date().toISOString();
    return [
      `**Request type:** ${form.type}`,
      `**Priority:** ${form.priority}`,
      `**Area:** ${form.area}`,
      "",
      `### Description`,
      form.description || "_(none provided)_",
      "",
      `### Why it matters`,
      form.why || "_(none provided)_",
      "",
      `### Expected behavior`,
      form.expected || "_(none provided)_",
      "",
      `**Reporter:** ${form.reporter || "Anonymous"}`,
      `**Demo-safe confirmation:** ${form.safe ? "✅ Yes — synthetic/demo data only" : "❌ Not confirmed"}`,
      `**Submitted:** ${ts}`,
      "",
      "---",
      "_Submitted via the FinSight Live Request Center._"
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

  function buildMailto(form) {
    const subj = encodeURIComponent(buildIssueTitle(form));
    const body = encodeURIComponent(buildIssueBody(form));
    return `mailto:${encodeURIComponent(PRESENTER_EMAIL)}?subject=${subj}&body=${body}`;
  }

  /* ---------- GITHUB AUTO-CREATE (token mode) ---------- */
  async function createIssueViaApi(form) {
    const token = getToken();
    if (!token) throw new Error("NO_TOKEN");
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`;
    const body = {
      title: buildIssueTitle(form),
      body:  buildIssueBody(form),
      labels: ["demo-request", form.type.toLowerCase().replace(/\s+/g, "-")]
    };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(`GitHub API ${res.status}: ${text.slice(0, 180)}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  async function testToken() {
    const token = $("gh-token").value.trim() || getToken();
    if (!token) { showTokenMsg("Paste a token first.", "err"); return; }
    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`, {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/vnd.github+json" }
      });
      if (res.ok) {
        const j = await res.json();
        showTokenMsg(`✓ Connected to ${j.full_name} (private=${j.private})`, "good");
      } else {
        const text = await res.text().catch(() => "");
        showTokenMsg(`✗ ${res.status}: ${text.slice(0, 140)}`, "err");
      }
    } catch (e) {
      showTokenMsg(`✗ ${e.message}`, "err");
    }
  }

  function showTokenMsg(msg, kind) {
    const el = $("token-msg");
    el.textContent = msg;
    el.style.color = kind === "err" ? "var(--red)" : kind === "good" ? "var(--green)" : "var(--dim)";
  }

  /* ---------- MAIN ACTIONS ---------- */
  async function submitRequest() {
    const form = readForm();
    const err = validate(form);
    if (err) { setError(err); return; }
    setError("");

    // Always save to local queue first so nothing is lost
    const queue = loadQueue();
    const entry = {
      id: "req-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ...form,
      status: "New",
      createdAt: new Date().toISOString(),
      githubIssue: null
    };
    queue.unshift(entry);
    saveQueue(queue);

    if (getToken() && ownerRepoConfigured()) {
      // Try auto-create via API
      try {
        const issue = await createIssueViaApi(form);
        entry.githubIssue = { number: issue.number, html_url: issue.html_url };
        entry.status = "On GitHub";
        const q2 = loadQueue();
        const i = q2.findIndex((x) => x.id === entry.id);
        if (i !== -1) { q2[i] = entry; saveQueue(q2); }
        flash(`✓ ISSUE #${issue.number} CREATED · ${issue.html_url}`, "good", 4500);
        clearForm();
        renderQueue();
        return;
      } catch (e) {
        flash(`✗ AUTO-CREATE FAILED — saved locally. ${e.message}`, "err", 5500);
        // fall through to local-only flow
      }
    } else {
      flash("✓ SAVED LOCALLY — connect a token to auto-create on GitHub.", "good");
    }
    clearForm();
    renderQueue();
  }

  function saveLocal() {
    const form = readForm();
    const err = validate(form);
    if (err) { setError(err); return; }
    setError("");
    const queue = loadQueue();
    queue.unshift({
      id: "req-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ...form,
      status: "New",
      createdAt: new Date().toISOString(),
      githubIssue: null
    });
    saveQueue(queue);
    flash("✓ SAVED LOCALLY");
    clearForm();
    renderQueue();
  }

  function generateIssue() {
    const form = readForm();
    const err = validate(form);
    if (err) { setError(err); return; }
    setError("");
    const body = buildIssueBody(form);
    const title = buildIssueTitle(form);
    $("issue-body").value = `Title: ${title}\n\n${body}`;
    $("issue-output").classList.add("visible");

    const wrap = $("issue-link-wrap");
    if (ownerRepoConfigured()) {
      const url = buildIssueUrl(form);
      $("issue-hint").textContent =
        `Repo: ${GITHUB_OWNER}/${GITHUB_REPO}. Opens GitHub's new-issue form pre-filled (requires GitHub login).`;
      wrap.innerHTML = `<a class="btn primary" target="_blank" rel="noopener" href="${escapeAttr(url)}">↗ OPEN ON GITHUB</a>`;
    } else {
      $("issue-hint").textContent =
        `GITHUB_OWNER / GITHUB_REPO not configured. Copy the body below and paste it into a new GitHub issue.`;
      wrap.innerHTML = "";
    }
  }

  function updateMailto() {
    const form = readForm();
    $("btn-mailto").href = buildMailto(form);
  }

  /* ---------- QUEUE ---------- */
  function renderQueue() {
    const queue = loadQueue();
    const root = $("queue");
    const count = $("queue-count");
    if (queue.length === 0) {
      count.textContent = "EMPTY · SAMPLES BELOW";
      root.innerHTML = SAMPLES.map((s) => sampleCard(s)).join("") +
        `<div class="queue-empty" style="grid-column:1/-1;">SAVE A REQUEST ABOVE TO SEE IT HERE</div>`;
      bindSampleButtons();
      return;
    }
    count.textContent = `${queue.length} SAVED`;
    root.innerHTML = queue.map((r) => queueCard(r)).join("");
    bindQueueButtons();
  }

  function queueCard(r) {
    const dt = formatTs(r.createdAt);
    const ghTag = r.githubIssue
      ? `<span class="tag gh-synced">GH #${r.githubIssue.number}</span>`
      : "";
    const ghBtn = r.githubIssue
      ? `<a class="btn sm" target="_blank" rel="noopener" href="${escapeAttr(r.githubIssue.html_url)}">↗ OPEN GH</a>`
      : `<button class="btn sm" data-act="push">⇧ PUSH TO GH</button>`;
    return `
      <article class="queue-card" data-id="${escapeAttr(r.id)}">
        <div class="qhead">
          <h4>${escapeHtml(r.title)}</h4>
          <span class="tag priority-${escapeAttr(r.priority)}">${escapeHtml(r.priority)}</span>
        </div>
        <div class="qmeta">
          <span class="tag type-${escapeAttr(r.type)}">${escapeHtml(r.type)}</span>
          <span>AREA: ${escapeHtml(r.area)}</span>
          <span>STATUS: ${escapeHtml(r.status)}</span>
          ${ghTag}
        </div>
        <div class="qmeta"><span>CREATED: ${escapeHtml(dt)}</span></div>
        <div class="qactions">
          ${ghBtn}
          <button class="btn sm" data-act="copy">📋 COPY</button>
          <button class="btn sm danger" data-act="del">DELETE</button>
        </div>
      </article>`;
  }

  function sampleCard(s) {
    return `
      <article class="queue-card sample">
        <div class="qhead">
          <h4>${escapeHtml(s.title)} <span class="tag" style="margin-left:6px;">SAMPLE</span></h4>
          <span class="tag priority-${escapeAttr(s.priority)}">${escapeHtml(s.priority)}</span>
        </div>
        <div class="qmeta">
          <span class="tag type-${escapeAttr(s.type)}">${escapeHtml(s.type)}</span>
          <span>AREA: ${escapeHtml(s.area)}</span>
        </div>
        <div class="qmeta muted"><span>${escapeHtml(s.description)}</span></div>
        <div class="qactions">
          <button class="btn sm" data-act="use-sample"
            data-payload='${escapeAttr(JSON.stringify(s))}'>USE THIS</button>
        </div>
      </article>`;
  }

  function bindQueueButtons() {
    document.querySelectorAll("#queue .queue-card").forEach((card) => {
      const id = card.dataset.id;
      const c = card.querySelector('[data-act="copy"]');     if (c) c.addEventListener("click", () => copyIssueBodyFor(id));
      const d = card.querySelector('[data-act="del"]');      if (d) d.addEventListener("click", () => deleteRequest(id));
      const p = card.querySelector('[data-act="push"]');     if (p) p.addEventListener("click", () => pushToGitHub(id));
    });
  }

  function bindSampleButtons() {
    document.querySelectorAll('#queue [data-act="use-sample"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        try {
          const s = JSON.parse(btn.dataset.payload);
          $("f-type").value = s.type;
          $("f-title").value = s.title;
          $("f-desc").value = s.description;
          $("f-why").value = s.why;
          $("f-expected").value = s.expected;
          $("f-priority").value = s.priority;
          $("f-area").value = s.area;
          $("f-safe").checked = true;
          $("f-title").focus();
          window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (e) {}
      });
    });
  }

  function copyIssueBodyFor(id) {
    const r = loadQueue().find((x) => x.id === id);
    if (!r) return;
    copyText(`Title: ${buildIssueTitle(r)}\n\n${buildIssueBody(r)}`);
  }

  function deleteRequest(id) {
    const q = loadQueue().filter((x) => x.id !== id);
    saveQueue(q);
    renderQueue();
  }

  async function pushToGitHub(id) {
    const queue = loadQueue();
    const r = queue.find((x) => x.id === id);
    if (!r) return;
    if (!getToken()) { flash("Connect a token in PRESENTER settings first.", "err"); return; }
    try {
      const issue = await createIssueViaApi(r);
      r.githubIssue = { number: issue.number, html_url: issue.html_url };
      r.status = "On GitHub";
      saveQueue(queue);
      flash(`✓ ISSUE #${issue.number} CREATED`, "good");
      renderQueue();
    } catch (e) {
      flash(`✗ PUSH FAILED: ${e.message}`, "err", 4500);
    }
  }

  async function pushAllToGitHub() {
    if (!getToken()) { flash("Connect a token in PRESENTER settings first.", "err"); return; }
    const queue = loadQueue();
    const pending = queue.filter((r) => !r.githubIssue);
    if (pending.length === 0) { flash("Nothing to push — all items are already on GitHub.", "good"); return; }
    if (!confirm(`Push ${pending.length} item(s) to GitHub as issues?`)) return;
    let ok = 0, fail = 0;
    for (const r of pending) {
      try {
        const issue = await createIssueViaApi(r);
        r.githubIssue = { number: issue.number, html_url: issue.html_url };
        r.status = "On GitHub";
        ok++;
      } catch (e) { fail++; }
    }
    saveQueue(queue);
    renderQueue();
    flash(`PUSH COMPLETE · ${ok} CREATED · ${fail} FAILED`, fail ? "err" : "good", 4500);
  }

  function clearQueue() {
    if (!confirm("Delete ALL locally saved requests? Cannot be undone.")) return;
    saveQueue([]);
    renderQueue();
  }

  /* ---------- TOKEN PANEL UI ---------- */
  function refreshTokenUi() {
    const has = !!getToken();
    const cfg = ownerRepoConfigured();
    const statusEl = $("token-status");
    if (has && cfg) {
      statusEl.textContent = "CONNECTED";
      statusEl.className = "status connected";
    } else {
      statusEl.textContent = "DISCONNECTED";
      statusEl.className = "status disconnected";
    }
    // Top mode banner
    const banner = $("mode-banner");
    if (has && cfg) {
      banner.innerHTML = `<div class="notice good">⚡ <b>AUTO-CREATE ON</b> · Submissions are posted directly to <code>${GITHUB_OWNER}/${GITHUB_REPO}</code> as GitHub issues. Audience needs no GitHub account.</div>`;
    } else if (cfg) {
      banner.innerHTML = `<div class="notice warn">○ <b>LOCAL ONLY</b> · Submissions are saved in this browser. Audience can also use <b>✉ EMAIL</b> or the <b>↗ OPEN ON GITHUB</b> link (requires GitHub login). Presenter: open the settings panel below to enable auto-create.</div>`;
    } else {
      banner.innerHTML = `<div class="notice err">GITHUB_OWNER / GITHUB_REPO not configured in <code>requests.js</code>. Auto-create disabled.</div>`;
    }
    // Status bar
    setText("bar-mode", (has && cfg) ? "AUTO-CREATE" : "LOCAL ONLY");
    setText("bar-repo", cfg ? `${GITHUB_OWNER}/${GITHUB_REPO}` : "--");
    // Open settings automatically if not connected, so presenter sees it
    const panel = $("token-panel");
    if (!has && cfg && panel) panel.open = true;
  }

  function bindTokenUi() {
    $("btn-token-save").addEventListener("click", () => {
      const t = $("gh-token").value.trim();
      if (!t) { showTokenMsg("Paste a token first.", "err"); return; }
      setToken(t);
      $("gh-token").value = "";
      showTokenMsg("✓ Token saved to this browser only. Testing…", "good");
      refreshTokenUi();
      testToken();
    });
    $("btn-token-test").addEventListener("click", testToken);
    $("btn-token-clear").addEventListener("click", () => {
      setToken("");
      $("gh-token").value = "";
      showTokenMsg("Token cleared.", "");
      refreshTokenUi();
    });
  }

  /* ---------- UTILS ---------- */
  function $(id) { return document.getElementById(id); }
  function setText(id, t) { const el = $(id); if (el) el.textContent = t; }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }
  function escapeAttr(s) { return escapeHtml(s); }
  function formatTs(iso) { try { return new Date(iso).toLocaleString(); } catch (_) { return iso; } }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => flash("COPIED TO CLIPBOARD"), () => fallbackCopy(text));
    } else fallbackCopy(text);
  }
  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); flash("COPIED"); } catch (_) {}
    document.body.removeChild(ta);
  }
  function flash(msg, kind, ms) {
    const t = document.createElement("div");
    t.className = "toast" + (kind ? " " + kind : "");
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), ms || 2400);
  }

  /* ---------- INIT ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    tickClock(); setInterval(tickClock, 1000);

    $("btn-submit").addEventListener("click", submitRequest);
    $("btn-save").addEventListener("click", saveLocal);
    $("btn-issue").addEventListener("click", generateIssue);
    $("btn-clear").addEventListener("click", clearForm);
    $("btn-copy-body").addEventListener("click", () => copyText($("issue-body").value));
    $("btn-clear-queue").addEventListener("click", clearQueue);
    $("btn-sync-all").addEventListener("click", pushAllToGitHub);

    // Keep the mailto link in sync with the form
    ["f-title", "f-desc", "f-why", "f-expected", "f-type", "f-priority", "f-area", "f-reporter", "f-safe"]
      .forEach((id) => $(id).addEventListener("input", updateMailto));
    updateMailto();

    bindTokenUi();
    refreshTokenUi();
    renderQueue();
  });
})();
