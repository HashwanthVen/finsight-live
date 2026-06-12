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
| `feature-requests.md` | Optional table of audience requests; the dashboard renders rows from this file in the LIVE AUDIENCE REQUESTS panel |
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

## Submitting requests — simple mobile-first form

The Request Center at `requests.html` is intentionally tiny: **3 fields,
one button, mobile-first.**

Fields:
1. **What should we build?** (title — required)
2. **Tell us more** (description — optional)
3. **Type** (Feature / Bug / UI polish / Idea)

### Submit behavior
Tapping **▶ SUBMIT** opens GitHub's prefilled new-issue page in a new
tab. The audience taps **"Submit new issue"** there to post it.
Requires a free GitHub account (one tap if they have the GitHub mobile app).

### Live Audience Requests panel
The dashboard reads `feature-requests.md` and renders the latest rows in a
**LIVE AUDIENCE REQUESTS** panel that auto-refreshes every 30 seconds.
After a submission shows up as an issue, append a row to
`feature-requests.md` to surface it in the dashboard panel (or wire that up
later with whatever automation you prefer).

### Repo configuration
At the top of `requests.js`:

```js
const GITHUB_OWNER = "HashwanthVen";
const GITHUB_REPO  = "finsight-live";
```

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
