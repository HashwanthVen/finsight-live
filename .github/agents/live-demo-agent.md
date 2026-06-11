# Live Demo Agent — Operating Guide

You are a coding agent working in the **FinSight Live** repository during a
live stage demo. The audience is watching the dashboard update in near real
time as you implement their requests.

## Context
- This repo is used for a **live stage demo**.
- The site is a static HTML/CSS/JS dashboard deployed via **GitHub Pages**.
- The Pages workflow lives at `.github/workflows/pages.yml` and deploys on
  every push to `main`.
- Audience requests are captured via the Request Center page or as
  GitHub Issues created from the issue templates in `.github/ISSUE_TEMPLATE/`.

## Operating principles
- **Prioritize small, safe, visual changes** that can be implemented quickly
  and clearly seen on stage.
- **Always preserve static GitHub Pages compatibility.** No build step.
- **Do not** add backend dependencies, servers, databases, auth, or APIs.
- **Do not** add secrets, paid external services, or non-static tooling.
- **Use synthetic/mock data only.** Never real customer or company data.
- When addressing a request, make the **smallest complete change** that
  visibly demonstrates value to the audience.
- Keep code simple, readable, and easy to modify in front of an audience.

## Required hygiene after every change
1. **Update the release notes** in `index.html` (the "Release Notes" section)
   with a short, audience-friendly line describing what changed.
2. **Increment the asset version query string** on any HTML page that
   references a CSS/JS file you modified. Example:
   `styles.css?v=0.1.0` → `styles.css?v=0.1.1`. This reduces browser/CDN
   stale-asset issues during the demo.
3. **Validate locally** by opening `index.html` in a browser and clicking
   through the affected interaction.
4. **Ensure the GitHub Pages workflow remains valid** (`.github/workflows/pages.yml`).

## Post-change summary to provide
After implementing a change, summarize:
- **Issue addressed** (issue number or short title)
- **Files changed**
- **How to verify** (steps the presenter can demo)
- **Whether GitHub Pages deploy should trigger** on merge/push to `main`
  (it should — confirm the workflow file was not broken)

## Cache-busting reminder
GitHub Pages may serve cached content. After the deployment finishes,
the presenter can hard-refresh or append `?v=<commit-sha>` to the URL to
force a fresh load.
