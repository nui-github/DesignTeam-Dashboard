# CLAUDE.md

Design Team Dashboard: Angular 19 + ng-zorro + Tailwind 4 front end, Vercel function API, ClickUp data. See README.md.

## Rules
- **Update the .md files on every change**: add an entry to CHANGELOG.md and fix any README.md section that drifted (stack, env vars, scripts, layout).
- Never put the ClickUp token or `DASHBOARD_PASSWORD` in client code, commits or chat. `.env` is git-ignored.
- Keep versions compatible with Node 20.12 (Angular 19, ng-zorro 19, Tailwind 4.0.17) unless Node is upgraded.
- UI text goes in `src/app/core/i18n.service.ts` (th + en). Brand colours/tokens live in `src/styles.css`.
- Fonts: IBM Plex Sans Thai. Icons: Lucide (register in `src/app/app.config.ts`). Logos: Simple Icons font (`si si-*`).
- Dev preview: `.claude/launch.json` configs `api-demo` (3111) and `web` (4210).
