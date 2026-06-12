# FinSight Live · Cloudflare Worker relay

This tiny Worker lets the audience submit requests **with one tap, no login,
no email**. The page POSTs `{title, description, type}` here; the Worker:

1. Appends a row to `feature-requests.md` in the repo (one commit per submission)
2. Creates a GitHub issue

The GitHub PAT lives only in Cloudflare's encrypted secret store. It is
**never** in the page, **never** in the repo, **never** sent to the browser.

---

## Deploy in 3 commands (≈10 minutes, free, no credit card)

```powershell
# 0. one-time: sign up at https://dash.cloudflare.com (email + password)

# 1. install wrangler CLI (Cloudflare's deploy tool)
npm i -g wrangler

# 2. log in (opens browser)
wrangler login

# 3. from this folder, paste the PAT and deploy
cd worker
wrangler secret put GH_TOKEN     # paste your fine-grained PAT when prompted
wrangler deploy                  # prints the live URL
```

You'll get a URL like:

```
https://finsight-relay.<your-subdomain>.workers.dev
```

Paste that URL into **either**:

- The page at <https://hashwanthven.github.io/finsight-live/requests.html> →
  expand **⚙ PRESENTER OPTIONS** → paste → SAVE (lives in your browser only), **OR**
- The top of `requests.js`:
  ```js
  const WORKER_URL_DEFAULT = "https://finsight-relay.your-subdomain.workers.dev";
  ```
  …commit, push — and now **every visitor** gets one-tap submit with no login.

---

## What the PAT needs

Create a fine-grained PAT at
<https://github.com/settings/personal-access-tokens/new>:

- **Resource owner:** `HashwanthVen`
- **Only select repositories:** `finsight-live`
- **Repository permissions:**
  - **Contents:** Read and write  (to append the row in `feature-requests.md`)
  - **Issues:** Read and write     (to create the issue)

Expiry: pick whatever you want (e.g. 30 days). When it expires just
`wrangler secret put GH_TOKEN` again.

---

## Optional: rate-limit with KV

Out of the box the Worker accepts unlimited requests. To rate-limit at
5 requests / IP / minute:

```powershell
wrangler kv namespace create finsight_rl
# wrangler prints something like:
#   [[kv_namespaces]]
#   binding = "RL"
#   id = "abc123..."
```

Paste those lines (uncommenting the existing block) into `wrangler.toml`, then
`wrangler deploy` again.

---

## Tear down after the demo

```powershell
wrangler delete                  # removes the Worker entirely
```

Or invalidate the PAT at <https://github.com/settings/personal-access-tokens>.

---

## Architecture

```
audience phone ── POST {title, description, type} ──▶  Cloudflare Worker
                                                          │  uses encrypted GH_TOKEN
                                                          ├──▶ PUT /repos/.../contents/feature-requests.md
                                                          │       (append 1 row, 1 commit)
                                                          └──▶ POST /repos/.../issues
                                                                  (create issue)
       ◀──── {ok: true, issue_url: ...} ──────────────────┘

push to main → GitHub Pages workflow runs → dashboard auto-updates with the new row
```

Total moving parts: 1 Worker (50 lines), 1 markdown file, 1 GH workflow. No
database, no server, no audience login.
