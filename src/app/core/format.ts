import { I18n } from './i18n.service';
import { TaskItem } from './models';

const startOfDay = (ms: number) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const dayDiff = (ms: number) => Math.round((startOfDay(ms) - startOfDay(Date.now())) / 86400000);

export function dueLabel(task: Pick<TaskItem, 'due' | 'group'>, i18n: I18n): { text: string; late: boolean } {
  if (task.due == null) return { text: i18n.t('noDue'), late: false };
  if (task.group === 'done') return { text: i18n.date(task.due), late: false };
  const d = dayDiff(task.due);
  if (d < 0) return { text: i18n.t('lateDays', { n: -d }), late: true };
  if (d === 0) return { text: i18n.t('today'), late: false };
  return { text: d <= 14 ? i18n.t('inDays', { n: d }) : i18n.date(task.due), late: false };
}

/** Brand-derived colours per status group. Keep in sync with --color-* in styles.css. */
export const GROUP_COLOR: Record<string, string> = {
  todo: 'var(--color-todo)',
  active: 'var(--color-brand)',
  review: 'var(--color-review)',
  done: 'var(--color-mint)',
};

/** Ordinal ramp (navy -> light blue) for priority. */
export const PRIORITY_COLOR: Record<string, string> = {
  urgent: 'var(--color-navy)',
  high: 'var(--color-brand)',
  normal: 'var(--color-review)',
  low: '#c3d4fd',
  none: 'var(--color-todo)',
};

export const safeUrl = (u: string) => (/^https?:\/\//.test(u) ? u : null);
