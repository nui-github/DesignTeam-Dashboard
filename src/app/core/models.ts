// Shape of GET /api/dashboard (see server/aggregate.js).
export type Group = 'todo' | 'active' | 'review' | 'done';
export type Priority = 'urgent' | 'high' | 'normal' | 'low' | 'none';

export const GROUPS: Group[] = ['todo', 'active', 'review', 'done'];
export const PRIORITIES: Priority[] = ['urgent', 'high', 'normal', 'low', 'none'];

export type GroupCounts = Record<Group, number>;
export type PriorityCounts = Record<Priority, number>;

export interface TaskItem {
  id: string;
  name: string;
  status: string;
  group: Group;
  priority: Exclude<Priority, 'none'> | null;
  due: number | null;
  overdue: boolean;
  closed: number | null;
  list: string;
  folder: string;
  url: string;
  tags: string[];
  assignees: string[];
}

export interface Summary {
  total: number;
  counts: GroupCounts;
  open: number;
  overdue: number;
  dueThisWeek: number;
  priority: PriorityCounts;
  completionRate: number;
  projects: { name: string; count: number }[];
}

export interface Person extends Summary {
  id: string;
  name: string;
  email?: string;
  initials: string;
  avatar?: string | null;
  tasks: TaskItem[];
}

export interface Kpi extends Summary {
  closedThisWeek: number;
  closedLastWeek: number;
  members: number;
}

export interface TrendPoint {
  weekStart: number;
  closed: number;
  created: number;
}

export interface Meeting {
  id: string;
  name: string;
  date: number | null;
  url: string;
  attendees: string[];
  summary: string;
  comments: { author: string; text: string; date: number | null }[];
}

export interface Activity {
  taskId: string;
  taskName: string;
  url: string;
  author: string;
  text: string;
  date: number | null;
}

export interface DashboardData {
  mode: 'live' | 'demo';
  generatedAt: number;
  cachedAt?: number;
  /** sprint = name of the current sprint List; KPIs/people are scoped to it. null = whole board. */
  scope: { sprint: string | null };
  /** Cancelled tasks in the headline scope, excluded from every count and rate. */
  cancelled: number;
  kpi: Kpi;
  trend: TrendPoint[];
  users: Person[];
  unassigned: Person | null;
  meetings: Meeting[];
  comments: Activity[];
}
