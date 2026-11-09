// ClickUp REST API v2 client. Returns raw ClickUp-shaped data; aggregate.js does the math.
const BASE = 'https://api.clickup.com/api/v2';
const MAX_PAGES = 30; // 100 tasks per page -> 3000 tasks ceiling
const PAGE_BATCH = 5; // concurrent page requests (ClickUp limit: 100 req/min)
const COMMENT_TASK_LIMIT = 20; // most recently updated tasks to read comments from
const MEETING_TASK_LIMIT = 15;
const CONCURRENCY = 4;

export class ClickUpError extends Error {
  constructor(message, { status, hint } = {}) {
    super(message);
    this.status = status;
    this.hint = hint;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function request(path, params, token, attempt = 0) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params || {})) {
    if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(`${k}[]`, x));
    else if (v !== undefined && v !== '') url.searchParams.set(k, v);
  }
  let res;
  try {
    res = await fetch(url, { headers: { Authorization: token, 'Content-Type': 'application/json' } });
  } catch (e) {
    // Transient connect/DNS hiccups are common on office networks: retry before giving up.
    if (attempt < 2) {
      await sleep(600 * (attempt + 1));
      return request(path, params, token, attempt + 1);
    }
    // Node's bare "fetch failed" hides the real reason in e.cause (DNS, timeout, TLS, proxy...).
    const code = e.cause?.code || e.cause?.message || e.message;
    throw new ClickUpError(`Cannot reach api.clickup.com (${code})`, {
      hint: 'Network problem between this machine and ClickUp: check internet/VPN/firewall/proxy. Try: curl -sS -m 10 https://api.clickup.com/api/v2/team',
    });
  }

  if (res.status === 429 && attempt < 2) {
    const reset = Number(res.headers.get('x-ratelimit-reset'));
    const wait = reset ? Math.max(1000, reset * 1000 - Date.now()) : 5000;
    await sleep(Math.min(wait, 15000));
    return request(path, params, token, attempt + 1);
  }
  if (!res.ok) {
    let body = '';
    try {
      body = (await res.json()).err || '';
    } catch {}
    const hints = {
      401: 'Token invalid. Check CLICKUP_TOKEN in .env.',
      403: 'Token has no access to this Workspace/Space.',
      404: 'ID not found. Run `npm run discover` and check CLICKUP_TEAM_ID / SPACE_IDS.',
      429: 'ClickUp rate limit hit (100 req/min). Wait a minute and refresh.',
    };
    throw new ClickUpError(`ClickUp ${res.status}${body ? `: ${body}` : ''}`, {
      status: res.status,
      hint: hints[res.status],
    });
  }
  return res.json();
}

const csv = (s) => (s || '').split(',').map((x) => x.trim()).filter(Boolean);

export function loadConfig(env = process.env) {
  return {
    token: env.CLICKUP_TOKEN,
    teamId: env.CLICKUP_TEAM_ID,
    spaceIds: csv(env.CLICKUP_SPACE_IDS),
    listIds: csv(env.CLICKUP_LIST_IDS),
    meetingTag: (env.MEETING_TAG || 'meeting').toLowerCase(),
    meetingListIds: csv(env.MEETING_LIST_IDS),
    // Only tasks touched in this window are fetched: enough for the current sprint and the 12-week chart,
    // and far fewer pages than the whole board history.
    historyDays: Number(env.HISTORY_DAYS) || 100,
  };
}

async function pagedTasks(path, baseParams, token) {
  // Pages are independent, so fetch PAGE_BATCH at a time (a board with ~1,800 tasks is 19 pages;
  // one by one that took ~27s). Stop after the batch that contains the last page.
  const out = [];
  for (let start = 0; start < MAX_PAGES; start += PAGE_BATCH) {
    const pages = await Promise.all(
      Array.from({ length: Math.min(PAGE_BATCH, MAX_PAGES - start) }, (_, i) =>
        request(path, { ...baseParams, page: start + i }, token),
      ),
    );
    let done = false;
    for (const data of pages) {
      out.push(...(data.tasks || []));
      if (data.last_page || !(data.tasks || []).length) done = true;
    }
    if (done) break;
  }
  return out;
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        results[idx] = await fn(items[idx]).catch(() => null); // a failed comment fetch must not break the page
      }
    }),
  );
  return results;
}

export async function fetchRaw(cfg) {
  if (!cfg.token) throw new ClickUpError('CLICKUP_TOKEN missing', { hint: 'Copy .env.example to .env and set CLICKUP_TOKEN, or run `npm run demo`.' });
  if (!cfg.teamId && !cfg.listIds.length)
    throw new ClickUpError('CLICKUP_TEAM_ID missing', { hint: 'Run `npm run discover` to find your Workspace id.' });

  const params = {
    include_closed: true,
    subtasks: true,
    order_by: 'updated',
    reverse: false,
    date_updated_gt: Date.now() - cfg.historyDays * 86400000,
  };
  let tasks = [];

  if (cfg.listIds.length) {
    for (const id of cfg.listIds) tasks.push(...(await pagedTasks(`/list/${id}/task`, params, cfg.token)));
  } else {
    tasks = await pagedTasks(`/team/${cfg.teamId}/task`, { ...params, space_ids: cfg.spaceIds }, cfg.token);
  }

  // Meeting list tasks may sit outside the main scope.
  const have = new Set(tasks.map((t) => t.id));
  for (const id of cfg.meetingListIds) {
    const extra = await pagedTasks(`/list/${id}/task`, params, cfg.token);
    for (const t of extra) if (!have.has(t.id)) tasks.push(t);
  }

  const isMeeting = (t) =>
    (t.tags || []).some((g) => (g.name || '').toLowerCase() === cfg.meetingTag) ||
    (t.list && cfg.meetingListIds.includes(String(t.list.id)));

  const byUpdated = [...tasks].sort((a, b) => Number(b.date_updated) - Number(a.date_updated));
  const meetingTasks = byUpdated.filter(isMeeting).slice(0, MEETING_TASK_LIMIT);
  const commentTasks = [...new Map([...byUpdated.slice(0, COMMENT_TASK_LIMIT), ...meetingTasks].map((t) => [t.id, t])).values()];

  const commentLists = await mapLimit(commentTasks, CONCURRENCY, async (t) => {
    const data = await request(`/task/${t.id}/comment`, {}, cfg.token);
    return { taskId: t.id, comments: data.comments || [] };
  });
  const comments = {};
  for (const c of commentLists) if (c) comments[c.taskId] = c.comments;

  return { tasks, comments, meetingIds: meetingTasks.map((t) => t.id) };
}

// Used by scripts/discover.js
export async function discover(token) {
  const { teams } = await request('/team', {}, token);
  const out = [];
  for (const t of teams) {
    const { spaces } = await request(`/team/${t.id}/space`, { archived: false }, token);
    out.push({ id: t.id, name: t.name, spaces: spaces.map((s) => ({ id: s.id, name: s.name })) });
  }
  return out;
}
