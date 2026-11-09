import { Component, computed, inject, input } from '@angular/core';
import { GROUP_COLOR, PRIORITY_COLOR } from '../core/format';
import { I18n } from '../core/i18n.service';
import { GROUPS, Kpi, PRIORITIES } from '../core/models';

/** Stacked status bar + legend, and open tasks by priority (ordinal navy -> light blue). */
@Component({
  selector: 'app-status-panel',
  template: `
    <div class="grid gap-9">
      <div>
        <h3 class="text-lg font-semibold">{{ sprint() ? i18n.t('statusSprint') : i18n.t('status') }}</h3>
        <div class="mt-4 flex h-3.5 gap-0.5" role="img" [attr.aria-label]="i18n.t('status')">
          @for (g of groups; track g) {
            @if (k().counts[g]) {
              <i class="block min-w-1 first:rounded-l-full last:rounded-r-full" [style.flex]="k().counts[g]" [style.background]="color[g]"></i>
            }
          }
        </div>
        <ul class="mt-4 grid gap-2">
          @for (g of groups; track g) {
            <li class="flex items-center gap-3">
              <i class="inline-block h-3 w-3 rounded-[3px]" [style.background]="color[g]"></i>
              <span>{{ i18n.t('g_' + g) }}</span>
              <b class="tabular ml-auto">{{ k().counts[g] }}</b>
              <span class="tabular w-12 text-right text-sm text-slate">{{ pct(k().counts[g]) }}%</span>
            </li>
          }
        </ul>
        @if (cancelled() > 0) { <p class="mt-4 text-sm text-slate">{{ i18n.t('cancelledNote', { n: cancelled() }) }}</p> }
      </div>

      <div>
        <h3 class="text-lg font-semibold">{{ i18n.t('priority') }}</h3>
        <div class="mt-4 grid gap-3">
          @for (p of prios(); track p) {
            <div class="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-3 text-sm">
              <span>{{ i18n.t('p_' + p) }}</span>
              <span class="h-2.5 overflow-hidden rounded-full bg-tint"><i class="block h-full rounded-full" [style.width.%]="(k().priority[p] / maxP()) * 100" [style.background]="prioColor[p]"></i></span>
              <b class="tabular text-right">{{ k().priority[p] }}</b>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class StatusPanelComponent {
  readonly i18n = inject(I18n);
  readonly k = input.required<Kpi>();
  readonly sprint = input<string | null>(null);
  readonly cancelled = input(0);
  readonly groups = GROUPS;
  readonly color = GROUP_COLOR;
  readonly prioColor = PRIORITY_COLOR;
  readonly prios = computed(() => PRIORITIES.filter((p) => p !== 'none' || this.k().priority.none > 0));
  readonly maxP = computed(() => Math.max(...PRIORITIES.map((p) => this.k().priority[p]), 1));
  pct(n: number) { return Math.round((n / (this.k().total || 1)) * 100); }
}
