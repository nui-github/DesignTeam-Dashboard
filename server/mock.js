// Sample data in ClickUp's raw shape, so aggregate.js is exercised the same way as in live mode.
// Dates are relative to "now" so the demo always looks current.
const DAY = 86400000;

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PEOPLE = [
  { id: 101, username: 'Nan', initials: 'NN' },
  { id: 102, username: 'Pim', initials: 'PM' },
  { id: 103, username: 'Mook', initials: 'MK' },
  { id: 104, username: 'Ton', initials: 'TN' },
  { id: 105, username: 'Fah', initials: 'FH' },
  { id: 106, username: 'Ben', initials: 'BN' },
];

const STATUSES = [
  { status: 'to do', type: 'open' },
  { status: 'in progress', type: 'custom' },
  { status: 'in review', type: 'custom' },
  { status: 'complete', type: 'closed' },
];

const PROJECTS = ['Mobile App 3.0', 'Design System', 'Campaign Q4', 'Website Revamp', 'Brand Refresh'];

const TITLES = [
  'Redesign onboarding flow', 'Icon set v2', 'Landing page hero variations', 'Design tokens audit',
  'Checkout usability test', 'Dark mode palette', 'Empty states illustration', 'Email template refresh',
  'Pricing page layout', 'Component spec: data table', 'Navigation IA review', 'Brand guideline update',
  'Social media kit', 'Dashboard wireframes', 'Accessibility pass: forms', 'Motion spec for transitions',
  'Product tour screens', 'Settings page redesign', 'Banner set for promo', 'Typography scale update',
  'Prototype: search results', 'Handoff: payment screens', 'Competitor UI benchmark', 'Illustration style guide',
];

const MEETINGS = [
  { name: 'Weekly Design Sync', note: 'Reviewed sprint progress. Onboarding flow on track; design tokens audit needs one more pass. Decision: freeze icon set v2 scope this week.' },
  { name: 'Design Critique: Checkout', note: 'Feedback on payment screens: reduce steps from 5 to 3, clearer error states. Owner to share revised flow before Thursday.' },
  { name: 'Stakeholder Review: Mobile App 3.0', note: 'Product asked for earlier delivery of onboarding. Agreed to split release: core flow first, polish after.' },
  { name: 'Sprint Planning', note: 'Capacity set at 38 points. Campaign Q4 assets prioritised; Website Revamp moves to next sprint.' },
  { name: 'Design System Office Hours', note: 'Engineers raised 3 gaps in the data table spec. Action: add keyboard behaviour and loading states.' },
];

const COMMENTS = [
  'Updated the Figma file, please take another look at the spacing on mobile.',
  'Blocked on copy from marketing. Following up today.',
  'Stakeholder approved option B. Moving to handoff.',
  'Contrast on the secondary button fails AA. Fixing in the next iteration.',
  'Usability test booked for Thursday, 5 participants confirmed.',
  'Exported assets are in the shared folder. Dev can pick them up.',
];

export function mockRaw(now = Date.now()) {
  const r = rng(20261109);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const tasks = [];

  for (let i = 0; i < 130; i++) {
    const who = [pick(PEOPLE)];
    if (r() < 0.12) who.push(pick(PEOPLE));
    const project = pick(PROJECTS);
    const roll = r();
    const st = roll < 0.14 ? STATUSES[0] : roll < 0.36 ? STATUSES[1] : roll < 0.46 ? STATUSES[2] : STATUSES[3];
    const done = st.type === 'closed';
    const created = now - Math.floor(r() * 84) * DAY;
    const due = done ? created + Math.floor(r() * 20 + 3) * DAY : now + Math.floor(r() * 30 - 3) * DAY;
    const closed = done ? Math.min(now - DAY * 0.2, created + Math.floor(r() * 35 + 2) * DAY) : null;
    const pr = r();
    tasks.push({
      id: `m${i}`,
      name: `${pick(TITLES)}${i % 4 === 0 ? ` (${project})` : ''}`,
      status: { ...st },
      priority: pr < 0.1 ? { priority: 'urgent' } : pr < 0.4 ? { priority: 'high' } : pr < 0.8 ? { priority: 'normal' } : pr < 0.92 ? { priority: 'low' } : null,
      assignees: who,
      due_date: String(Math.round(due)),
      date_created: String(Math.round(created)),
      date_closed: closed ? String(Math.round(closed)) : null,
      date_updated: String(Math.round(closed ?? now - r() * 6 * DAY)),
      list: { id: 1, name: project },
      folder: { name: 'hidden' },
      tags: [],
      url: '#',
      text_content: '',
    });
  }

  // Two people each have a few unassigned items
  for (let i = 0; i < 3; i++) {
    tasks.push({
      id: `u${i}`,
      name: pick(TITLES),
      status: { ...STATUSES[0] },
      priority: { priority: 'normal' },
      assignees: [],
      due_date: String(now + (i + 3) * DAY),
      date_created: String(now - 5 * DAY),
      date_closed: null,
      date_updated: String(now - 2 * DAY),
      list: { id: 1, name: 'Backlog' },
      folder: { name: 'hidden' },
      tags: [],
      url: '#',
      text_content: '',
    });
  }

  const comments = {};
  const meetingIds = [];
  MEETINGS.forEach((m, i) => {
    const id = `meet${i}`;
    const date = now - (i * 4 + 1) * DAY;
    tasks.push({
      id,
      name: m.name,
      status: { ...STATUSES[3] },
      priority: null,
      assignees: PEOPLE.slice(0, 3 + (i % 3)),
      due_date: String(date),
      date_created: String(date - 3 * DAY),
      date_closed: String(date),
      date_updated: String(date),
      list: { id: 2, name: 'Meetings' },
      folder: { name: 'hidden' },
      tags: [{ name: 'meeting' }],
      url: '#',
      text_content: m.note,
    });
    meetingIds.push(id);
    comments[id] = [{ id: `c-${id}`, comment_text: pick(COMMENTS), user: pick(PEOPLE), date: String(date + 3600000) }];
  });

  tasks.slice(0, 12).forEach((t, i) => {
    comments[t.id] = [{ id: `c${i}`, comment_text: pick(COMMENTS), user: pick(PEOPLE), date: String(now - (i * 7 + 2) * 3600000) }];
  });

  return { tasks, comments, meetingIds };
}
