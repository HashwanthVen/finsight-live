// FinSight Live — Cloudflare Worker relay
//
// Receives POST {title, description, type} from the static page,
// validates + rate-limits, then:
//   1) appends a row to feature-requests.md in the repo (single commit)
//   2) creates a GitHub Issue
// The PAT is never exposed to the browser — it lives in Cloudflare's
// encrypted secret store (env.GH_TOKEN).
//
// Required Worker secrets (set with `wrangler secret put NAME`):
//   GH_TOKEN  — fine-grained PAT with Contents: R/W + Issues: R/W on the repo
// Configured in wrangler.toml (or via env vars):
//   OWNER     — GitHub owner (default: HashwanthVen)
//   REPO      — repo name    (default: finsight-live)
//   BRANCH    — branch       (default: main)

const ALLOWED_TYPES = new Set(["Feature", "Bug", "UI polish", "Idea"]);
const MAX_TITLE = 140;
const MAX_DESC  = 1200;
const FILE_PATH = "feature-requests.md";

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (request.method !== "POST") {
      return json({ error: "POST only" }, 405, corsHeaders);
    }

    // ---- rate limit (per IP, 5 req / 60s) using KV ----
    if (env.RL) {
      const ip = request.headers.get("CF-Connecting-IP") || "anon";
      const key = "rl:" + ip;
      const cur = parseInt((await env.RL.get(key)) || "0", 10);
      if (cur >= 5) return json({ error: "rate limited — try again in a minute" }, 429, corsHeaders);
      await env.RL.put(key, String(cur + 1), { expirationTtl: 60 });
    }

    let body;
    try { body = await request.json(); } catch (e) {
      return json({ error: "invalid json" }, 400, corsHeaders);
    }
    const title = String(body.title || "").trim().slice(0, MAX_TITLE);
    const description = String(body.description || "").trim().slice(0, MAX_DESC);
    const type  = ALLOWED_TYPES.has(body.type) ? body.type : "Feature";

    if (!title) return json({ error: "title required" }, 400, corsHeaders);

    const owner  = env.OWNER  || "HashwanthVen";
    const repo   = env.REPO   || "finsight-live";
    const branch = env.BRANCH || "main";
    const token  = env.GH_TOKEN;
    if (!token) return json({ error: "server not configured (GH_TOKEN missing)" }, 500, corsHeaders);

    const when = new Date().toISOString().replace("T", " ").slice(0, 16);
    const who  = "audience";
    const issueTitle = `[${type}] ${title}`;
    const issueBody  = [
      `**Type:** ${type}`, "",
      `### What`, title, "",
      `### Details`, description || "_(none)_", "",
      `**Submitted:** ${when} UTC · via FinSight Live relay`
    ].join("\n");

    try {
      // 1) Append a row to feature-requests.md
      const getRes = await gh(token, `/repos/${owner}/${repo}/contents/${FILE_PATH}?ref=${branch}`);
      if (!getRes.ok) {
        const t = await getRes.text();
        throw new Error(`GET file ${getRes.status}: ${t.slice(0, 120)}`);
      }
      const fileMeta = await getRes.json();
      const current = atob(fileMeta.content.replace(/\n/g, ""));
      const escTitle = title.replace(/\|/g, "\\|");
      const newRow = `| ${when} | ${type} | ${escTitle} | ${who} |\n`;
      const updated = current.endsWith("\n") ? current + newRow : current + "\n" + newRow;
      const putRes = await gh(token, `/repos/${owner}/${repo}/contents/${FILE_PATH}`, {
        method: "PUT",
        body: JSON.stringify({
          message: `request: ${issueTitle}`,
          content: btoa(unescape(encodeURIComponent(updated))),
          sha: fileMeta.sha,
          branch
        })
      });
      if (!putRes.ok) {
        const t = await putRes.text();
        throw new Error(`PUT file ${putRes.status}: ${t.slice(0, 120)}`);
      }

      // 2) Create the GitHub Issue
      const issueRes = await gh(token, `/repos/${owner}/${repo}/issues`, {
        method: "POST",
        body: JSON.stringify({
          title: issueTitle,
          body: issueBody,
          labels: ["demo-request", type.toLowerCase().replace(/\s+/g, "-")]
        })
      });
      if (!issueRes.ok) {
        const t = await issueRes.text();
        // file row already committed — don't fail the user
        return json({ ok: true, warn: `issue create failed: ${issueRes.status}` }, 200, corsHeaders);
      }
      const issue = await issueRes.json();
      return json({
        ok: true,
        issue_number: issue.number,
        issue_url: issue.html_url
      }, 200, corsHeaders);
    } catch (e) {
      return json({ error: e.message }, 500, corsHeaders);
    }
  }
};

function gh(token, path, init = {}) {
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "User-Agent": "finsight-live-relay",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });
}

function json(obj, status, extra) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json", ...(extra || {}) }
  });
}
