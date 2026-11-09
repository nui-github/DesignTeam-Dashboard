# Changelog

Update this file with every change (see CLAUDE.md).

## 2026-11-09 — Sprint-focused numbers, faster ClickUp fetch
- Cancelled tasks (status matches cancel/ยกเลิก/reject/abandon/won't/obsolete) are excluded from every count, rate and chart; a footnote shows how many in the sprint.
- Headline, KPIs, status/priority and the per-person cards are now scoped to the current sprint: the List whose name matches `CURRENT_SPRINT_MATCH` (default `current`, e.g. "Sprint 42 (Current)"). No match = whole board as before. The 12-week chart still covers all recent work.
- Only tasks updated in the last `HISTORY_DAYS` (default 100) are fetched: live load went from ~27s / 1,850 tasks to ~3s / 249 tasks with identical sprint numbers and chart.
- ClickUp pages are fetched 5 at a time; network errors are retried twice.
- `CACHE_TTL_SECONDS` default 60 → 300 (an existing `.env` copy keeps its own value).
- Demo data now has sprint Lists and cancelled tasks; added `api-live` preview config.

## 2026-11-09 — Clearer network errors
- ClickUp client now reports the real cause of `fetch failed` (DNS/timeout/TLS code) with a hint, instead of a bare "fetch failed".

## 2026-11-09 — Claude Code git access
- Added `.claude/settings.local.json` (git-ignored, per machine): allows `git add/commit/push` and github.com in the sandbox network allowlist so Claude can push without a manual approval each time.

## 2026-11-09 — 2.0.0 Angular rebuild, Vercel-ready
- Rebuilt the UI in Angular 19 + ng-zorro-antd 19 + Tailwind 4; icons Lucide; logos Simple Icons font; font IBM Plex Sans Thai.
- Applied brand colours from the reference (navy/blue/green, grey, gradient); soft background shapes from the reference slide.
- Components: hero sentence + KPI tiles, throughput chart (SVG), status/priority panel, member cards, ng-zorro drawer, meetings/activity feed, TH/EN toggle, full screen.
- API: shared `server/handler.js`; `api/dashboard.js` Vercel function; `server/index.js` is dev-only (port 3111).
- Optional `DASHBOARD_PASSWORD` gate (401 + login screen) because the Vercel URL is public.
- Added `vercel.json`, `proxy.conf.json`, `.claude/launch.json` (dev preview), git repo with SSH remote.
- Removed the vanilla JS front end and dark mode.
- Pinned Tailwind 4.0.17 (4.3 needs Node ≥ 20.19).

## 2026-11-09 — 1.0.0 First version
- Express server + vanilla JS dashboard, ClickUp client, aggregation, demo data, README.
