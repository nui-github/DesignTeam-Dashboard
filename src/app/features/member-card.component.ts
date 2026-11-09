import { Component, computed, inject, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { GROUP_COLOR, dueLabel } from '../core/format';
import { I18n } from '../core/i18n.service';
import { GROUPS, Person } from '../core/models';

/** One card per person: counts, status bar, next 3 tasks. Click opens the drawer. */
@Component({
  selector: 'app-member-card',
  host: { class: 'block min-w-0' },
  imports: [LucideAngularModule],
  template: `
    <button type="button" (click)="select.emit()"
            class="card group relative block h-full w-full cursor-pointer rounded-[1.6rem] border border-line bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[0_10px_30px_-12px_rgba(31,93,249,.35)]"
            [attr.aria-label]="p().name + ': ' + p().open + ' ' + i18n.t('nOpen') + ', ' + p().overdue + ' ' + i18n.t('nOverdue')">
      <span class="absolute inset-x-0 top-0 h-1.5 bg-brand-gradient" aria-hidden="true"></span>

      <div class="flex items-center gap-3.5">
        <span class="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-gradient p-[2.5px]">
          <span class="grid h-full w-full place-items-center overflow-hidden rounded-full bg-navy text-sm font-bold text-white">
            @if (p().avatar) { <img [src]="p().avatar" alt="" class="h-full w-full object-cover" referrerpolicy="no-referrer"> } @else { {{ p().initials }} }
          </span>
        </span>
        <div class="min-w-0">
          <div class="truncate text-lg font-semibold leading-tight">{{ displayName() }}</div>
          <div class="text-sm text-slate">{{ p().total }} {{ i18n.t('tasksN') }} · {{ pct() }}% {{ i18n.t('rate') }}</div>
        </div>
      </div>

      <div class="mt-5 grid grid-cols-3 gap-2">
        <div><b class="num block">{{ p().open }}</b><span class="lbl">{{ i18n.t('nOpen') }}</span></div>
        <div>
          <b class="num flex items-center gap-1.5" [class.text-critical]="p().overdue > 0">
            @if (p().overdue > 0) { <lucide-icon name="triangle-alert" [size]="18" aria-hidden="true" /> }{{ p().overdue }}
          </b>
          <span class="lbl">{{ i18n.t('nOverdue') }}</span>
        </div>
        <div><b class="num block">{{ p().dueThisWeek }}</b><span class="lbl">{{ i18n.t('nWeek') }}</span></div>
      </div>

      <div class="mt-4 flex h-2 gap-0.5" aria-hidden="true">
        @for (g of groups; track g) {
          @if (p().counts[g]) { <i class="block min-w-1 first:rounded-l-full last:rounded-r-full" [style.flex]="p().counts[g]" [style.background]="color[g]"></i> }
        }
      </div>

      @if (next().length) {
        <ul class="mt-4 grid grid-cols-1 gap-1.5 border-t border-line pt-3 text-sm">
          @for (t of next(); track t.id) {
            <li class="flex min-w-0 items-baseline gap-3">
              <span class="min-w-0 flex-1 truncate" [title]="t.name">{{ t.name }}</span>
              <span class="shrink-0 whitespace-nowrap text-xs" [class.font-semibold]="t.due.late" [class.text-critical]="t.due.late" [class.text-slate]="!t.due.late">{{ t.due.text }}</span>
            </li>
          }
        </ul>
      } @else {
        <p class="mt-4 border-t border-line pt-3 text-sm text-slate">{{ i18n.t('noOpen') }}</p>
      }
    </button>
  `,
  styles: `
    /* Plain CSS, not a Tailwind utility: ng-zorro's unlayered button reset (overflow: visible) beats Tailwind's layered
       overflow-hidden, which let the gradient bar poke out of the rounded corners. */
    .card { overflow: hidden; }
    .num { font-size: 1.9rem; font-weight: 700; line-height: 1.1; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
    .lbl { display: block; font-size: .8rem; color: var(--color-slate); }
  `,
})
export class MemberCardComponent {
  readonly i18n = inject(I18n);
  readonly p = input.required<Person>();
  readonly select = output<void>();
  readonly groups = GROUPS;
  readonly color = GROUP_COLOR;
  readonly displayName = computed(() => (this.p().id === 'unassigned' ? this.i18n.t('unassigned') : this.p().name));
  readonly pct = computed(() => Math.round(this.p().completionRate * 100));
  readonly next = computed(() =>
    this.p().tasks.filter((t) => t.group !== 'done').slice(0, 3).map((t) => ({ ...t, due: dueLabel(t, this.i18n) })),
  );
}
