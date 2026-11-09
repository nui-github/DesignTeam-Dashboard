# Design Team Dashboard

Executive dashboard for the Design team. Pulls tasks, comments and meetings live from ClickUp and shows
one page: headline sentence, KPIs, 12-week throughput, status/priority, a card per person, meetings and latest activity.

| Layer | Tech |
|---|---|
| UI | Angular 19 (standalone, signals) + [ng-zorro-antd](https://ng.ant.design) 19 |
| Styling | Tailwind CSS 4 (brand tokens in `src/styles.css`) |
| Icons | [Lucide](https://lucide.dev) (`lucide-angular`), brand logos from [Simple Icons font](https://simpleicons.org) |
| Font | IBM Plex Sans Thai (self-hosted, `@fontsource`) |
| API | `api/dashboard.js` Vercel function (dev: `server/index.js`) → ClickUp REST v2 |
| Hosting | GitHub → Vercel |

Brand colours (from the reference): navy `#010136`, blue `#1F5DF9`, green `#16EA9E`, grey `#666666`, white; gradient `#1F5DF9 → #16EA9E`.

## Run locally

```bash
npm install
npm run demo     # API with sample data + Angular dev server → http://localhost:4210
```

`npm run dev` does the same against real ClickUp (needs `.env`, see below). Angular proxies `/api` to the local API on port 3111 (`proxy.conf.json`).

## Connect to ClickUp

1. ClickUp > avatar (bottom-left) > **Settings > Apps > API Token > Generate**.
2. `cp .env.example .env`, paste the token into `CLICKUP_TOKEN`. The token stays on the server, never in the browser.
3. `npm run discover` lists Workspace and Space ids. Set `CLICKUP_TEAM_ID` and `CLICKUP_SPACE_IDS` (the Design Space).
4. `npm run dev`.

### Meetings
Tasks tagged `meeting` (`MEETING_TAG`) or inside `MEETING_LIST_IDS` appear in **Recent meetings** and are not counted as design work.
Task description = summary; latest comments feed **Latest activity**. Notes kept in ClickUp Docs/Chat are not read yet.

## Deploy: GitHub → Vercel

Remote: `git@github.com:nui-github/DesignTeam-Dashboard.git` (branch `main`).

```bash
git push -u origin main
```

Then in Vercel: **Add New > Project > import the repo**. `vercel.json` already sets the build command, output
(`dist/design-dashboard/browser`), SPA rewrite and security headers. Add these **Environment Variables**
(Production + Preview):

| Name | Value |
|---|---|
| `CLICKUP_TOKEN` | your personal API token |
| `CLICKUP_TEAM_ID` | from `npm run discover` |
| `CLICKUP_SPACE_IDS` | Design Space id(s), comma separated |
| `DASHBOARD_PASSWORD` | **required in practice**: shared password shown on a login screen |
| `MEETING_TAG`, `MEETING_LIST_IDS`, `TZ` | optional |

**Security:** the Vercel URL is public. Without `DASHBOARD_PASSWORD` anyone with the link sees internal task data.
With it, `/api/dashboard` answers 401 until the password is sent (`x-dashboard-key` header, kept in `sessionStorage`).
The static page itself contains no data. Every push to `main` redeploys; other branches get preview URLs.
Responses are `Cache-Control: private, no-store`; the function caches ClickUp results in memory for `CACHE_TTL_SECONDS` (60).

## Project layout

```
api/dashboard.js        Vercel function (GET /api/dashboard)
server/                 shared API logic: handler, clickup client, aggregate, mock, cache; index.js = local dev API
scripts/discover.js     list ClickUp workspace/space ids
src/styles.css          fonts, brand tokens (@theme), ng-zorro variable overrides
src/app/core/           models, i18n (TH/EN dictionary), dashboard service, format helpers
src/app/features/       hero, throughput-chart, status-panel, member-card, member-drawer, feed, login
src/app/app.component.ts  page shell
vercel.json  proxy.conf.json  angular.json
```

Editing the design: change a component in `src/app/features/*` (templates are inline, styled with Tailwind classes),
or brand tokens in `src/styles.css`. The dev server hot-reloads.
New Lucide icon: import it in `src/app/app.config.ts` (`ICONS`) then use `<lucide-icon name="kebab-name">`.
New brand logo: `<i class="si si-figma"></i>`.
All text lives in `src/app/core/i18n.service.ts` (add a key to both `th` and `en`).

## How numbers are defined
- **Done**: ClickUp status type done/closed. **In review**: status name has review/approval/feedback/QA. **Not started**: open type. Else **In progress**.
- **Overdue**: not done and due before today. **Due this week**: today through Sunday.
- A task with two assignees counts for both people; team totals count it once.
- Weeks start Monday in `TZ`.
- ClickUp allows 100 requests/minute. Comments are read for the 20 most recently updated tasks plus meetings.

## Requirements
Node ≥ 20.11. Versions are pinned to what Node 20.12 supports: Angular 19, ng-zorro 19, Tailwind 4.0.17
(newer Tailwind/Angular need Node ≥ 20.19). Upgrade Node first if you want to bump them.

See [CHANGELOG.md](CHANGELOG.md) for history.
