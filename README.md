# FinSight Live

A GitHub Pages-ready static dashboard for **live AI-assisted feature demos**.
FinSight Live looks like a polished executive finance dashboard. During a
stage demo, the audience can suggest features or bugs, you create or pick a
GitHub Issue, a coding agent implements the change, and a push/merge to `main`
auto-deploys to GitHub Pages on the same URL.

> Synthetic data only. No backend, no database, no auth, no build step.

---

## What's in here

| File / folder | Purpose |
|---|---|
| `index.html` | Executive dashboard (KPIs, trend chart, regions, products, risks, insights, release notes) |
| `requests.html` | Audience-facing Request Center (form + local queue + GitHub Issue link generator) |
| `styles.css` | All styling (dark navy theme, responsive) |
| `app.js` | Dashboard behavior — filters, chart toggle, risk review, insight rotation |
| `requests.js` | Request Center behavior — localStorage queue, prefilled GitHub issue URL |
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
Pages on every push to `main` and on manual dispatch.

**One-time setup in the repository:**
1. Go to **Repository → Settings**.
2. Go to **Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to `main` (or run the workflow manually from the **Actions** tab).
5. Open the deployed URL printed in the workflow's **Deploy to GitHub Pages**
   step output (and on the GitHub Pages settings page).

That's it. From then on, **every push to `main` auto-deploys**.

---

## Configure GitHub issue links

`requests.js` builds a prefilled GitHub issue URL. The constants at the top of
the file control which repo it points to:

```js
const GITHUB_OWNER = "HashwanthVen";
const GITHUB_REPO  = "finsight-live";
```

- If both are set to a real repo, the Request Center shows an **Open GitHub
  Issue** button that opens the new-issue page pre-filled with the request.
- If either is left as `REPLACE_WITH_OWNER` / `REPLACE_WITH_REPO`, the
  Request Center falls back to a **copyable issue body** so you can paste
  it into a new issue manually.

---

## How live updates work

GitHub Pages is **auto-deploy, not real-time streaming**. The goal is to make
updates appear as quickly as Pages allows after a push/merge to `main`:

1. Coding agent commits a change (directly to `main`, or via a PR that gets
   merged into `main`).
2. `.github/workflows/pages.yml` runs automatically.
3. The workflow uploads the repo root as the Pages artifact and deploys it.
4. The same Pages URL serves the updated content once the deploy job is green.
5. Browser/CDN cache may briefly show old content — see below.

### Cache-busting

Static assets in `index.html` and `requests.html` are referenced with a version
query string, e.g. `styles.css?v=0.1.0`. After changing CSS or JS, the coding
agent should **bump the version** on touched pages (e.g. to `?v=0.1.1`) to
reduce stale-asset issues during the demo.

When refreshing the deployed URL during a demo:
- Hard refresh (`Ctrl+Shift+R` / `Cmd+Shift+R`), **or**
- Append a query string, e.g. `https://hashwanthven.github.io/finsight-live/?v=demo-1`

---

## Suggested live demo flow

1. Show the dashboard baseline.
2. Ask the audience for a feature or bug request.
3. Capture the request in **Request Center** (`requests.html`).
4. Click **Generate GitHub Issue link** → open or paste into a new GitHub
   Issue (or use the issue templates directly under **Issues → New issue**).
5. Ask a coding agent to implement the selected issue.
6. Agent commits the change (directly to `main`, or opens a PR).
7. Merge / push to `main`.
8. Watch the **Deploy FinSight Live to GitHub Pages** workflow in the
   **Actions** tab.
9. Refresh the Pages URL with a cache-busting query string.
10. Show the updated dashboard live.

### Suggested audience requests to try
- Add dark/light mode toggle
- Add a forecast variance KPI card
- Add a risk heatmap
- Add a year-over-year comparison mode
- Add a chart type toggle (bar ↔ line)
- Improve the mobile layout
- Add an export-CSV button
- Add accessibility improvements (focus rings, ARIA labels)

---

## Acceptance checklist

- [x] App runs locally via `index.html` with no build step.
- [x] Deployable to GitHub Pages as static files.
- [x] GitHub Actions Pages workflow created at `.github/workflows/pages.yml`.
- [x] `.nojekyll` file present.
- [x] Dashboard is visually polished with KPIs, chart, regions, products,
      risks, AI insights, and release notes.
- [x] Request Center works without a backend (localStorage queue).
- [x] Prefilled GitHub issue generation works, with a fallback to a
      copyable body when repo placeholders are not configured.
- [x] Agent instruction files under `.github/agents/`.
- [x] README explains deployment and live-demo refresh flow.
- [x] No secrets, no real data, no build step required.

---

_Built for live AI-assisted development demos. Synthetic data only._
