# Changelog

Update this file with every change (see CLAUDE.md).

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
