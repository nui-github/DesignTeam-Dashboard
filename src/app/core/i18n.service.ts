import { Injectable, computed, signal } from '@angular/core';

export type Lang = 'th' | 'en';

// Every user-facing string lives here. Add a key to both languages.
const DICT = {
  th: {
    title: 'ทีม Design', subtitle: 'แดชบอร์ดงานของทีม', refresh: 'รีเฟรช', fullscreen: 'เต็มจอ', exitFullscreen: 'ออกจากเต็มจอ',
    lang: 'EN', loading: 'กำลังโหลดข้อมูลจาก ClickUp…', close: 'ปิด', updated: 'อัปเดต',
    demo: 'ข้อมูลตัวอย่าง (Demo) — ยังไม่ได้เชื่อมต่อ ClickUp', source: 'ข้อมูลจาก',
    members: 'คนในทีม', openTasks: 'งานที่ยังเปิดอยู่',
    heroDone: 'ทีม Design ปิดงานแล้ว', heroOf: 'จาก', heroTasks: 'งาน', heroOverdue: 'และมีงานเลยกำหนด', heroTail: 'งาน',
    k_open: 'งานที่กำลังทำอยู่', k_overdue: 'เลยกำหนด', k_week: 'ครบกำหนดสัปดาห์นี้', k_closed: 'ปิดแล้วสัปดาห์นี้',
    ofOpen: 'ของงานที่เปิดอยู่', inProgress: 'กำลังทำ', sameAsLast: 'เท่าสัปดาห์ก่อน', vsLast: 'จากสัปดาห์ก่อน',
    trend: 'ปริมาณงาน 12 สัปดาห์ล่าสุด', trendSub: 'งานที่ปิดเทียบกับงานที่สร้างใหม่ในแต่ละสัปดาห์',
    closed: 'ปิดแล้ว', created: 'สร้างใหม่', weekOf: 'สัปดาห์ที่เริ่ม',
    status: 'สถานะงานทั้งหมด', priority: 'งานที่เปิดอยู่ตามความสำคัญ',
    g_todo: 'ยังไม่เริ่ม', g_active: 'กำลังทำ', g_review: 'รอตรวจ', g_done: 'เสร็จแล้ว',
    p_urgent: 'ด่วนมาก', p_high: 'สูง', p_normal: 'ปกติ', p_low: 'ต่ำ', p_none: 'ไม่ระบุ',
    team: 'งานรายคน', teamHint: 'คลิกที่การ์ดเพื่อดูรายละเอียด', sort: 'เรียงตาม', s_open: 'งานค้าง', s_overdue: 'เลยกำหนด', s_name: 'ชื่อ',
    nOpen: 'งานค้าง', nOverdue: 'เลยกำหนด', nWeek: 'ครบสัปดาห์นี้', noOpen: 'ไม่มีงานค้าง', rate: 'เสร็จแล้ว', tasksN: 'งาน',
    unassigned: 'ยังไม่มอบหมาย', meetings: 'Meeting ล่าสุด', activity: 'ความเคลื่อนไหวล่าสุด',
    noMeetings: 'ยังไม่พบ meeting — ติดแท็ก “meeting” ให้งานใน ClickUp', noComments: 'ยังไม่มีคอมเมนต์', attendees: 'ผู้เข้าร่วม', onTask: 'ในงาน',
    today: 'วันนี้', lateDays: 'เลย {n} วัน', inDays: 'อีก {n} วัน', noDue: 'ไม่มีกำหนด',
    projects: 'โปรเจกต์ที่ทำอยู่', recentlyDone: 'เสร็จล่าสุด',
    errTitle: 'โหลดข้อมูลไม่สำเร็จ', retry: 'ลองอีกครั้ง',
    loginTitle: 'เข้าสู่แดชบอร์ด', loginHint: 'ใส่รหัสผ่านที่ได้รับเพื่อดูข้อมูลทีม', password: 'รหัสผ่าน', enter: 'เข้าสู่ระบบ', wrongPw: 'รหัสผ่านไม่ถูกต้อง', logout: 'ออกจากระบบ',
  },
  en: {
    title: 'Design Team', subtitle: 'Team work dashboard', refresh: 'Refresh', fullscreen: 'Full screen', exitFullscreen: 'Exit full screen',
    lang: 'TH', loading: 'Loading from ClickUp…', close: 'Close', updated: 'Updated',
    demo: 'Sample data (demo) — ClickUp is not connected', source: 'Data from',
    members: 'people', openTasks: 'open tasks',
    heroDone: 'The design team has closed', heroOf: 'of', heroTasks: 'tasks', heroOverdue: 'with', heroTail: 'overdue',
    k_open: 'Open tasks', k_overdue: 'Overdue', k_week: 'Due this week', k_closed: 'Closed this week',
    ofOpen: 'of open tasks', inProgress: 'in progress', sameAsLast: 'Same as last week', vsLast: 'vs last week',
    trend: 'Throughput, last 12 weeks', trendSub: 'Tasks closed vs. tasks created each week',
    closed: 'Closed', created: 'Created', weekOf: 'Week of',
    status: 'All tasks by status', priority: 'Open tasks by priority',
    g_todo: 'Not started', g_active: 'In progress', g_review: 'In review', g_done: 'Done',
    p_urgent: 'Urgent', p_high: 'High', p_normal: 'Normal', p_low: 'Low', p_none: 'None',
    team: 'Work by person', teamHint: 'Select a card for details', sort: 'Sort by', s_open: 'Open', s_overdue: 'Overdue', s_name: 'Name',
    nOpen: 'Open', nOverdue: 'Overdue', nWeek: 'Due this week', noOpen: 'No open tasks', rate: 'done', tasksN: 'tasks',
    unassigned: 'Unassigned', meetings: 'Recent meetings', activity: 'Latest activity',
    noMeetings: 'No meetings found. Tag tasks with “meeting” in ClickUp.', noComments: 'No comments yet', attendees: 'Attendees', onTask: 'on',
    today: 'Today', lateDays: '{n}d late', inDays: 'in {n}d', noDue: 'No due date',
    projects: 'Projects', recentlyDone: 'Recently done',
    errTitle: 'Could not load data', retry: 'Try again',
    loginTitle: 'Sign in to the dashboard', loginHint: 'Enter the password you were given to view team data', password: 'Password', enter: 'Sign in', wrongPw: 'Wrong password', logout: 'Sign out',
  },
} as const;

export type Key = keyof (typeof DICT)['th'];

@Injectable({ providedIn: 'root' })
export class I18n {
  readonly lang = signal<Lang>(read() ?? 'th');
  readonly locale = computed(() => (this.lang() === 'th' ? 'th-TH' : 'en-GB'));

  /** Dynamic keys (e.g. 'g_' + group) are allowed; unknown keys render as the key itself. */
  t(key: Key | (string & {}), params?: Record<string, string | number>): string {
    let s: string = (DICT[this.lang()] as Record<string, string>)[key] ?? key;
    for (const [k, v] of Object.entries(params ?? {})) s = s.replace(`{${k}}`, String(v));
    return s;
  }

  toggle() {
    const next: Lang = this.lang() === 'th' ? 'en' : 'th';
    this.lang.set(next);
    try { localStorage.setItem('lang', next); } catch { /* storage unavailable */ }
    document.documentElement.lang = next;
  }

  date(ms: number, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) {
    return new Intl.DateTimeFormat(this.locale(), opts).format(new Date(ms));
  }
  dateTime(ms: number) {
    return this.date(ms, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}

function read(): Lang | null {
  try { const v = localStorage.getItem('lang'); return v === 'en' || v === 'th' ? v : null; } catch { return null; }
}
