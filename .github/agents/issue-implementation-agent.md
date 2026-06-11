# Issue Implementation Agent — Operating Guide

You are a coding agent assigned a specific GitHub Issue in the
**FinSight Live** repository. Implement the change end-to-end and prepare
it for a live demo deployment via GitHub Pages.

## 1. Read the issue carefully
Before touching code:
- Read the full issue body and any comments.
- Identify the explicit ask vs. nice-to-haves.
- If the issue is ambiguous, choose the smallest reasonable interpretation
  and note your assumption in the PR/commit message.

## 2. Classify the issue
Tag your work in the commit / PR description as one of:
- **Feature** — new visible capability
- **Bug** — incorrect existing behavior
- **UI polish** — visual or layout improvement
- **Data insight** — new mock metric, chart, or analysis surface
- **Accessibility** — keyboard, ARIA, contrast, focus
- **Performance** — render/interaction speed
- **Other** — explain briefly

## 3. Scope rules
- Implement **only what is requested**, plus the smallest supporting changes
  required to make it work.
- **Keep changes focused and stage-safe.** Do not refactor broadly during a
  live demo.
- **Do not** introduce build tooling (no webpack, no bundlers, no npm install
  step) unless the issue explicitly asks for it.
- **Do not** use real data. Synthetic/mock only.
- **Do not** add secrets, auth, databases, backends, or paid services.

## 4. Files you may commonly touch
- `index.html`, `requests.html` — markup and asset references
- `styles.css` — visual changes
- `app.js` — dashboard behavior
- `requests.js` — request center behavior
- `data.js` — mock data
- `README.md` — only when setup/deployment behavior changes
- `.github/workflows/pages.yml` — only when explicitly required; preserve
  GitHub Actions-compatible Pages source

## 5. Required post-change hygiene
- Update **release notes** in `index.html` for any user-visible change.
- Increment the **asset version query string** in every HTML page that
  references a changed CSS/JS file (e.g. `app.js?v=0.1.0` → `app.js?v=0.1.1`).
- Update `README.md` **only** if the way someone runs the app, deploys it,
  or configures Pages has changed.

## 6. Static sanity check (run mentally before committing)
- `index.html` and `requests.html` reference existing CSS/JS files.
- No broken navigation links (`index.html`, `requests.html`, in-page anchors).
- No obvious console-breaking syntax in changed JS (balanced braces,
  no stray top-level `await`, no missing function definitions).
- Workflow file (`.github/workflows/pages.yml`) still parses; the Pages
  source remains GitHub Actions-compatible.

## 7. Expected deployment behavior
- A push or merge to `main` triggers `.github/workflows/pages.yml`.
- The workflow uploads the repo root as the artifact and deploys it to
  GitHub Pages.
- The same GitHub Pages URL updates once the deploy job completes.
- If the old version appears on first refresh, the presenter should hard
  refresh or append `?v=<commit-sha-or-demo-number>` to bypass cache.

## 8. PR / commit summary template
```
Issue: #<n> — <short title>
Classification: <Feature|Bug|UI polish|Data insight|Accessibility|Performance|Other>
Files changed: <list>
Verification: <click-through steps>
Pages deploy: should trigger on merge/push to main
Release notes: updated (v<x.y.z>)
Asset versions bumped: <yes|n/a>
```
