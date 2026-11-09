// Turns raw ClickUp tasks/comments into the JSON the dashboard renders.
const DAY = 86400000;
const WEEKS = 12;
const PRIORITIES = ['urgent', 'high', 'normal', 'low'];

const startOfDay = (ms) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const startOfWeek = (ms) => {
  // Monday-based week
  const d = new Date(startOfDay(ms));
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
};
const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

// Statuses that mean "dropped", not "finished": excluded from every count and rate.
const CANCELLED = /cancel|ยกเลิก|reject|abandon|won'?t|obsolete/i;
export const isCancelled = (task) => CANCELLED.test(task.status?.status || '');

// done | review | todo | active
export function statusGroup(task) {
  const s = task.status || {};
  const type = (s.type || '').toLowerCase();
  if (type === 'done' || type === 'closed' || task.date_closed) return 'done';
  const name = (s.status || '').toLowerCase();
  if (/review|approv|feedback|qa|testing|รีวิว|ตรวจ/.test(name)) return 'review';
  if (type === 'open' || /^(to ?do|open|backlog|new|not started|ยังไม่)/.test(name)) return 'todo';
  return 'active';
}

function normalizeTask(t, now) {
  const group = statusGroup(t);
  const due = num(t.due_date);
  const overdue = group !== 'done' && due !== null && startOfDay(due) < startOfDay(now);
  return {
    id: t.id,
    name: t.name,
    status: t.status?.status || '',
    group,
    cancelled: isCancelled(t),
    priority: t.priority?.priority?.toLowerCase() || null,
    due,
    overdue,
    created: num(t.date_created),
    closed: num(t.date_closed) ?? num(t.date_done),
    updated: num(t.date_updated),
    list: t.list?.name || '',
    folder: t.folder?.name && t.folder.name !== 'hidden' ? t.folder.name : '',
    url: t.url || `https://app.clickup.com/t/${t.id}`,
    tags: (t.tags || []).map((g) => g.name),
    assignees: (t.assignees || []).map((a) => ({
      id: String(a.id),
      name: a.username || a.email || `User ${a.id}`,
      email: a.email || '',
      initials: a.initials || (a.username || '?').slice(0, 2).toUpperCase(),
      avatar: a.profilePicture || null,
    })),
    description: (t.text_content || t.description || '').trim(),
  };
}

const emptyGroups = () => ({ todo: 0, active: 0, review: 0, done: 0 });
const emptyPriority = () => ({ urgent: 0, high: 0, normal: 0, low: 0, none: 0 });

function summarize(tasks, now) {
  const counts = emptyGroups();
  const priority = emptyPriority(); // open tasks only
  const projects = new Map();
  let overdue = 0;
  let dueThisWeek = 0;
  const weekEnd = startOfWeek(now) + 7 * DAY;
  for (const t of tasks) {
    counts[t.group]++;
    if (t.group !== 'done') {
      priority[t.priority || 'none']++;
      if (t.overdue) overdue++;
      else if (t.due !== null && t.due < weekEnd && startOfDay(t.due) >= startOfDay(now)) dueThisWeek++;
      const p = t.folder || t.list || '—';
      projects.set(p, (projects.get(p) || 0) + 1);
    }
  }
  const total = tasks.length;
  return {
    total,
    counts,
    open: total - counts.done,
    overdue,
    dueThisWeek,
    priority,
    completionRate: total ? counts.done / total : 0,
    projects: [...projects].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
  };
}

const PRIORITY_RANK = { urgent: 0, high: 1, normal: 2, low: 3 };
function sortOpen(a, b) {
  // overdue first, then due date, then priority
  if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
  const ad = a.due ?? Infinity;
  const bd = b.due ?? Infinity;
  if (ad !== bd) return ad - bd;
  return (PRIORITY_RANK[a.priority] ?? 4) - (PRIORITY_RANK[b.priority] ?? 4);
}

function slimTask(t) {
  const { description, assignees, created, updated, ...rest } = t;
  return { ...rest, assignees: assignees.map((a) => a.name) };
}

function buildPerson(person, tasks, now) {
  const open = tasks.filter((t) => t.group !== 'done').sort(sortOpen);
  const done = tasks
    .filter((t) => t.group === 'done')
    .sort((a, b) => (b.closed ?? 0) - (a.closed ?? 0))
    .slice(0, 8);
  return { ...person, ...summarize(tasks, now), tasks: [...open, ...done].map(slimTask) };
}

const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

export function aggregate(raw, { now = Date.now(), mode = 'live' } = {}) {
  // Meeting records are shown in their own section, not counted as design work.
  const meetingSet = new Set(raw.meetingIds || []);
  const everything = raw.tasks.filter((t) => !meetingSet.has(t.id)).map((t) => normalizeTask(t, now));
  const tasks = everything.filter((t) => !t.cancelled);

  // Headline scope: the current sprint (a List whose name matches CURRENT_SPRINT_MATCH, default "current"),
  // falling back to everything when no such List exists.
  const sprintRe = new RegExp(process.env.CURRENT_SPRINT_MATCH || 'current', 'i');
  const sprintTasks = tasks.filter((t) => sprintRe.test(t.list));
  const sprintName = sprintTasks[0]?.list || null;
  const scoped = sprintTasks.length ? sprintTasks : tasks;
  const team = summarize(scoped, now);
  // Cancelled tasks that would have belonged to the headline scope (shown as a footnote).
  const cancelled = everything.filter((t) => t.cancelled && (!sprintName || sprintRe.test(t.list))).length;

  // KPI extras
  const thisWeek = startOfWeek(now);
  const closedThisWeek = tasks.filter((t) => t.closed && t.closed >= thisWeek).length;
  const closedLastWeek = tasks.filter((t) => t.closed && t.closed >= thisWeek - 7 * DAY && t.closed < thisWeek).length;

  // Trend: last 12 weeks, closed vs created
  const trend = [];
  for (let i = WEEKS - 1; i >= 0; i--) {
    const start = thisWeek - i * 7 * DAY;
    const end = start + 7 * DAY;
    trend.push({
      weekStart: start,
      closed: tasks.filter((t) => t.closed && t.closed >= start && t.closed < end).length,
      created: tasks.filter((t) => t.created && t.created >= start && t.created < end).length,
    });
  }

  // People — a task with 2 assignees counts for both; team totals count it once.
  const people = new Map();
  const unassigned = [];
  for (const t of scoped) {
    if (!t.assignees.length) unassigned.push(t);
    for (const a of t.assignees) {
      if (!people.has(a.id)) people.set(a.id, { person: { id: a.id, name: a.name, email: a.email, initials: a.initials, avatar: a.avatar }, tasks: [] });
      people.get(a.id).tasks.push(t);
    }
  }
  const users = [...people.values()]
    .map(({ person, tasks: ts }) => buildPerson(person, ts, now))
    .sort((a, b) => b.open - a.open || a.name.localeCompare(b.name));

  // Meetings
  const byId = new Map(raw.tasks.map((t) => [t.id, t]));
  const meetings = (raw.meetingIds || [])
    .map((id) => {
      const t = byId.get(id);
      if (!t) return null;
      const n = normalizeTask(t, now);
      const cs = (raw.comments[id] || []).slice(0, 3).map((c) => ({
        author: c.user?.username || '',
        text: clip((c.comment_text || '').trim(), 220),
        date: num(c.date),
      }));
      return {
        id,
        name: n.name,
        date: n.due ?? n.created,
        url: n.url,
        attendees: n.assignees.map((a) => a.name),
        summary: clip(n.description.replace(/\s+/g, ' '), 260),
        comments: cs,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.date ?? 0) - (a.date ?? 0))
    .slice(0, 6);

  // Latest comments across tasks (excluding empty)
  const comments = [];
  for (const [id, list] of Object.entries(raw.comments || {})) {
    const t = byId.get(id);
    if (!t) continue;
    for (const c of list) {
      const text = (c.comment_text || '').trim();
      if (!text) continue;
      comments.push({ taskId: id, taskName: t.name, url: t.url, author: c.user?.username || '', text: clip(text, 240), date: num(c.date) });
    }
  }
  comments.sort((a, b) => (b.date ?? 0) - (a.date ?? 0));

  return {
    mode,
    generatedAt: now,
    scope: { sprint: sprintName ? sprintName.replace(/\s*\(current\)\s*/i, '').trim() : null },
    cancelled,
    kpi: { ...team, closedThisWeek, closedLastWeek, members: users.length },
    trend,
    users,
    unassigned: unassigned.length ? buildPerson({ id: 'unassigned', name: 'Unassigned', initials: '–' }, unassigned, now) : null,
    meetings,
    comments: comments.slice(0, 8),
  };
}
