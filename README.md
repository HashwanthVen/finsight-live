# FinSight Live

A GitHub Pages-ready **Bloomberg-style terminal** dashboard for
**live AI-assisted feature demos**. Looks like an executive finance terminal
(amber-on-black, ticker tape, function keys, command line). During a stage
demo, audience members suggest features or bugs through a one-click submit
form, you (or a coding agent) implement the change, and a push/merge to
`main` auto-deploys to GitHub Pages on the same URL.

> Synthetic data only. No backend, no database, no auth, no build step.

---

## 🔗 Live links

| Thing | URL |
|---|---|
| **Live dashboard** | https://hashwanthven.github.io/finsight-live/ |
| **Request Center** (share this with the audience) | https://hashwanthven.github.io/finsight-live/requests.html |
| **GitHub repo** | https://github.com/HashwanthVen/finsight-live |
| **Issues** (where audience requests land) | https://github.com/HashwanthVen/finsight-live/issues |
| **New feature request (template)** | https://github.com/HashwanthVen/finsight-live/issues/new?template=feature_request.yml |
| **New bug report (template)** | https://github.com/HashwanthVen/finsight-live/issues/new?template=bug_report.yml |
| **Actions / deployments** | https://github.com/HashwanthVen/finsight-live/actions |

Tip for live demos: append a cache-buster like `?v=demo-N` (e.g.
`https://hashwanthven.github.io/finsight-live/?v=demo-3`) when refreshing
after a deploy.

---

## What's in here

| File / folder | Purpose |
|---|---|
| `index.html` | Bloomberg-style terminal dashboard (ticker, fkeys, command bar, KPIs, SVG trend, regions, products, risks, insights, release notes) |
| `requests.html` | Audience-facing Request Center (one-click "Submit to GitHub" + email + presenter auto-create) |
| `styles.css` | Terminal theme (black/amber, monospace, sharp panels, responsive) |
| `app.js` | Dashboard behavior — ticker, clock, chart, filters, command bar, risk review, insight rotation |
| `requests.js` | Request Center behavior — form, prefilled GitHub issue URL, mailto, optional PAT auto-create, local queue |
| `data.js` | Mock/synthetic data for the dashboard |
| `.nojekyll` | Tells GitHub Pages to serve files as-is (no Jekyll processing) |
| `.github/workflows/pages.yml` | Auto-deploys the repo root to GitHub Pages on push to `main` |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | Structured feature request form on GitHub |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | Structured bug report form on GitHub |
| `.github/agents/live-demo-agent.md` | Operating guide for live-demo coding agents |
| `.github/agents/issue-implementation-agent.md` | Operating guide for issue-implementing coding agents |

---

## Run locally

No build step. Just open the file:

```powershell
# from this folder
start index.html
```

…or serve it with any static server (handy because `file://` blocks some
features in older browsers):

```powershell
# Python 3
python -m http.server 8080
# then visit http://localhost:8080
```

---

## Deploy to GitHub Pages

The workflow `.github/workflows/pages.yml` deploys the repo root to GitHub
Pages on every push to `main` and on manual dispatch. Pages source is set
to **GitHub Actions** (already configured for this repo).

**One-time setup (already done for `HashwanthVen/finsight-live`):**

1. Repository → **Settings** → **Pages**
2. **Source** → **GitHub Actions**
3. Push to `main` (or run the workflow manually from the **Actions** tab)
4. Open the URL printed in the workflow's **Deploy to GitHub Pages** step

From then on, **every push to `main` auto-deploys**.

---

## Submitting requests — what the audience sees

The Request Center (`requests.html`) has four submission paths. The first
one is the default and works for anyone with a free GitHub account.

### 1. ▶ SUBMIT TO GITHUB *(primary, recommended)*
Audience fills the form and taps the big amber button. A new tab opens on
`github.com/HashwanthVen/finsight-live/issues/new` with **title, body, and
labels pre-filled**. They click GitHub's green **"Submit new issue"** →
issue lands in your repo. Requires a free GitHub account (one tap if they
have the GitHub mobile app).

### 2. ⚡ AUTO-CREATE *(optional — presenter only)*
If you (the presenter) paste a fine-grained PAT into the
**⚙ PRESENTER · AUTO-CREATE SETTINGS** panel on your demo device, an extra
**⚡ AUTO-CREATE** button appears on the form. One tap → issue created via
the GitHub REST API, no redirect. The token is stored only in your
browser's `localStorage`, never committed, never sent anywhere except
`api.github.com`.

Create a token at
<https://github.com/settings/personal-access-tokens/new>:
- **Resource owner:** `HashwanthVen`
- **Only select repositories:** `finsight-live`
- **Repository permissions → Issues → Read and write**

### 3. ✉ EMAIL
Opens the user's mail app with a pre-filled message to the presenter.
Works on every mobile device, no GitHub account needed. The presenter
can paste the body into a new issue afterwards.

### 4. 💾 SAVE LOCAL
Every submission is also saved to the browser's `localStorage` queue as a
backup. The queue panel includes **⇧ PUSH ALL TO GH** to bulk-create issues
from the queue using the presenter PAT.

### Repo configuration
The owner / repo for all the above is set at the top of `requests.js`:

```js
const GITHUB_OWNER = "HashwanthVen";
const GITHUB_REPO  = "finsight-live";
```

If left as `REPLACE_WITH_OWNER` / `REPLACE_WITH_REPO`, the page falls back
to local-queue + copyable body only.

---

## How live updates work

GitHub Pages is **auto-deploy, not real-time streaming**. The goal is to
make updates appear as quickly as Pages allows after a push/merge to
`main`:

1. Coding agent commits a change (directly to `main`, or via a PR that
   gets merged into `main`).
2. `.github/workflows/pages.yml` runs automatically.
3. The workflow uploads the repo root as the Pages artifact and deploys it.
4. The same Pages URL serves the updated content once the deploy job is
   green (~15–60 s typical).
5. Browser/CDN cache may briefly show old content — see below.

### Cache-busting
Static assets in `index.html` and `requests.html` are referenced with a
version query string, e.g. `styles.css?v=0.3.0`. After changing CSS or JS,
the coding agent should **bump the version** on touched pages (e.g. to
`?v=0.3.1`) to reduce stale-asset issues during the demo.

When refreshing the deployed URL during a demo:
- Hard refresh (`Ctrl+Shift+R` / `Cmd+Shift+R`), **or**
- Append a query string, e.g.
  `https://hashwanthven.github.io/finsight-live/?v=demo-3`

---

## Suggested live demo flow

1. Show the dashboard baseline at the live URL.
2. Share the Request Center link with the audience
   (https://hashwanthven.github.io/finsight-live/requests.html).
3. Audience submits a feature/bug → issue lands at
   https://github.com/HashwanthVen/finsight-live/issues.
4. Open the issue and hand it to a coding agent (point it at
   `.github/agents/issue-implementation-agent.md`).
5. Agent commits the change directly to `main`, or opens a PR.
6. Merge / push to `main`.
7. Watch the **Deploy FinSight Live to GitHub Pages** workflow run at
   https://github.com/HashwanthVen/finsight-live/actions.
8. Refresh the Pages URL with a cache-busting query string.
9. Show the updated dashboard live.

### Suggested audience requests to try
- Add a dark/light theme toggle
- Add a forecast variance KPI tile
- Add a risk heatmap
- Add a year-over-year comparison mode
- Add a chart type toggle (line ↔ area ↔ bar)
- Improve the mobile layout
- Add an export-CSV button
- Add accessibility improvements (focus rings, ARIA labels)

---

## Acceptance checklist

- [x] App runs locally via `index.html` with no build step.
- [x] Deployable to GitHub Pages as static files.
- [x] GitHub Actions Pages workflow created at `.github/workflows/pages.yml`.
- [x] `.nojekyll` file present.
- [x] Dashboard is visually polished (Bloomberg terminal style: ticker,
      fkeys, command bar, SVG chart, status bar).
- [x] Request Center works without a backend (localStorage queue).
- [x] Primary submit path opens GitHub's prefilled new-issue page in a
      new tab — no PAT required.
- [x] Optional presenter PAT mode for one-tap auto-create.
- [x] Email fallback for users without a GitHub account.
- [x] Agent instruction files under `.github/agents/`.
- [x] README explains live links, deployment, and demo refresh flow.
- [x] No secrets, no real data, no build step required.

---

_Built for live AI-assisted development demos. Synthetic data only._
