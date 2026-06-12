/* FinSight Live — Request Center (v0.4.1, simplified)
   - 3-field mobile-first form
   - Submit opens the prefilled GitHub new-issue page in a new tab.
     Audience needs a free GitHub account to post.
   - Reads feature-requests.md to show a live "audience requests" feed. */
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

  // Parse the markdown table in feature-requests.md.
  function parseRequestsTable(md) {
    const lines = md.split(/\r?\n/);
    const out = [];
    let headerSeen = false;
    for (const ln of lines) {
      if (!ln.trim().startsWith("|")) { headerSeen = false; continue; }
      if (/^\|\s*-+/.test(ln)) { headerSeen = true; continue; }
      if (!headerSeen) continue;
      const cells = ln.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.length < 3) continue;
      out.push({ when: cells[0], type: cells[1], title: cells[2], who: cells[3] || "" });
    }
    return out.reverse();
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
    $("req-form").addEventListener("submit", submit);
  });
})();
