/* FinSight Live — Request Center (v0.4.1, simplified)
   - 3-field mobile-first form
   - Submit opens the prefilled GitHub new-issue page in a new tab.
     Audience needs a free GitHub account to post.
   - Reads GitHub Issues directly to show a live "audience requests" feed. */
(function () {
  "use strict";

  // ---- CONFIG -----------------------------------------------------------------
  const GITHUB_OWNER = "HashwanthVen";
  const GITHUB_REPO  = "finsight-live";
  // -----------------------------------------------------------------------------

  function $(id) { return document.getElementById(id); }

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

  /* ---------- FEED (live from GitHub Issues) ---------- */
  async function loadFeed() {
    const feed = $("feed");
    if (!feed) return;
    try {
      const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=all&per_page=20&sort=created&direction=desc&_=${Date.now()}`;
      const res = await fetch(url, { headers: { "Accept": "application/vnd.github+json" } });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const issues = data.filter((i) => !i.pull_request).slice(0, 10);
      if (issues.length === 0) {
        feed.innerHTML = `<div class="feed-empty">No requests yet. Be the first ▲</div>`;
        return;
      }
      feed.innerHTML = `<ul>` + issues.map((i) => {
        const type = (i.title.match(/^\[([^\]]+)\]/) || [, "REQ"])[1].toUpperCase();
        const cleanTitle = i.title.replace(/^\[[^\]]+\]\s*/, "");
        const when = formatWhen(i.created_at);
        const who = i.user && i.user.login ? "@" + i.user.login : "anon";
        return `
          <li>
            <span class="tag">${esc(type)}</span>
            <div>
              <div><a href="${esc(i.html_url)}" target="_blank" rel="noopener" style="color:var(--white);text-decoration:none;">${esc(cleanTitle)}</a></div>
              <span class="feed-meta">${esc(when)} · ${esc(who)} · #${i.number}</span>
            </div>
          </li>`;
      }).join("") + `</ul>`;
    } catch (e) {
      feed.innerHTML = `<div class="feed-empty">Feed unavailable.</div>`;
    }
  }
  function formatWhen(iso) {
    try {
      const d = new Date(iso);
      const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
      if (diffMin < 1) return "just now";
      if (diffMin < 60) return diffMin + "m ago";
      const diffHr = Math.round(diffMin / 60);
      if (diffHr < 24) return diffHr + "h ago";
      return d.toLocaleDateString();
    } catch (e) { return iso; }
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

  function submit(e) {
    e.preventDefault();
    const form = {
      title:       $("f-title").value.trim(),
      description: $("f-desc").value.trim(),
      type:        $("f-type").value
    };
    if (!form.title) { showResult("Please enter a title.", "err"); return; }

    const ghUrl = buildIssueUrl(form);
    window.open(ghUrl, "_blank", "noopener");
    showResult(
      `Opened GitHub — tap <b>"Submit new issue"</b> there to post it. Requires a free GitHub account.`,
      "good"
    );
  }

  function showResult(msg, kind) {
    const el = $("result");
    el.className = "submit-result show " + (kind || "");
    el.innerHTML = msg;
    setTimeout(() => { el.classList.remove("show"); }, 9000);
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
    setInterval(loadFeed, 30000);
    $("req-form").addEventListener("submit", submit);
  });
})();
