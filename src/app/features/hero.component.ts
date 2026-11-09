import { Component, computed, inject, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { I18n } from '../core/i18n.service';
import { Kpi } from '../core/models';

/** Headline sentence + 4 KPI tiles. The sentence is the focal point of the page. */
@Component({
  selector: 'app-hero',
  imports: [LucideAngularModule],
  template: `
    <section class="relative overflow-hidden" aria-labelledby="hero-h1">
      <!-- soft shapes borrowed from the brand reference slide -->
      <div class="pointer-events-none absolute -left-24 -top-24 h-[34rem] w-[48rem] bg-tint"
           style="clip-path: polygon(0 0, 100% 0, 62% 100%, 0 78%)" aria-hidden="true"></div>
      <div class="pointer-events-none absolute -right-32 top-24 h-[30rem] w-[26rem] rounded-tl-[12rem] bg-tint-2" aria-hidden="true"></div>

      <div class="relative mx-auto max-w-[88rem] px-6 pb-10 pt-12 lg:px-10">
        <h1 id="hero-h1" class="max-w-[22em] text-[clamp(1.9rem,3.6vw,3.6rem)] font-medium leading-[1.4] tracking-tight text-navy text-balance">
          @if (sprint()) { {{ i18n.t('heroSprintDone', { name: sprint()! }) }} } @else { {{ i18n.t('heroDone') }} }
          <b class="fig">{{ k().counts.done }}</b>
          {{ i18n.t('heroOf') }} <b class="fig">{{ k().total }}</b> {{ i18n.t('heroTasks') }}
          <span class="whitespace-nowrap">(<b class="fig">{{ pct() }}%</b>)</span>
          {{ i18n.t('heroOverdue') }}
          <b class="fig" [class.bad]="k().overdue > 0">{{ k().overdue }}</b> {{ i18n.t('heroTail') }}
        </h1>
        <p class="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-slate">
          <span class="inline-flex items-center gap-2"><lucide-icon name="users" [size]="18" aria-hidden="true" />{{ k().members }} {{ i18n.t('members') }}</span>
          <span>{{ k().open }} {{ i18n.t('openTasks') }}</span>
        </p>

        <dl class="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          <div class="tile">
            <dt>{{ i18n.t('k_open') }}</dt>
            <dd class="num">{{ k().open }}</dd>
            <p class="note">{{ k().counts.active + k().counts.review }} {{ i18n.t('inProgress') }}</p>
          </div>
          <div class="tile">
            <dt>{{ i18n.t('k_overdue') }}</dt>
            <dd class="num" [class.text-critical]="k().overdue > 0">{{ k().overdue }}</dd>
            <p class="note">{{ overduePct() }}% {{ i18n.t('ofOpen') }}</p>
          </div>
          <div class="tile">
            <dt>{{ i18n.t('k_week') }}</dt>
            <dd class="num">{{ k().dueThisWeek }}</dd>
            <p class="note">&nbsp;</p>
          </div>
          <div class="tile">
            <dt>{{ i18n.t('k_closed') }}</dt>
            <dd class="num">{{ k().closedThisWeek }}</dd>
            <p class="note inline-flex items-center gap-1">
              @if (delta() > 0) { <lucide-icon name="trending-up" [size]="16" class="text-brand" aria-hidden="true" /> }
              @if (delta() < 0) { <lucide-icon name="trending-down" [size]="16" class="text-slate" aria-hidden="true" /> }
              {{ deltaText() }}
            </p>
          </div>
        </dl>
      </div>
    </section>
  `,
  styles: `
    /* Figures: solid brand blue for legibility, gradient underline drawn as a bottom border on an inline-block with
       line-height 1, so the underline sits right under the digits instead of clashing with Thai tone marks. */
    .fig {
      display: inline-block; line-height: 1; padding: 0 .04em .12em; margin: 0 .04em;
      font-weight: 700; color: var(--color-brand);
      border-bottom: .09em solid transparent;
      border-image: var(--background-image-brand-gradient-h) 1;
    }
    .fig.bad { color: var(--color-critical); border-image: none; border-bottom-color: var(--color-critical); }
    .tile { background: #fff; border: 1px solid var(--color-line); border-radius: 1.6rem; padding: 1.1rem 1.4rem 1rem; }
    .tile dt { color: var(--color-slate); font-size: .95rem; }
    .tile .num { margin: 0; font-size: clamp(2.4rem, 3.6vw, 3.8rem); font-weight: 700; line-height: 1.1; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
    .tile .note { margin: .15rem 0 0; color: var(--color-slate); font-size: .85rem; }
  `,
})
export class HeroComponent {
  readonly i18n = inject(I18n);
  readonly k = input.required<Kpi>();
  /** Current sprint name, or null when the headline covers the whole board. */
  readonly sprint = input<string | null>(null);
  readonly pct = computed(() => Math.round(this.k().completionRate * 100));
  readonly overduePct = computed(() => (this.k().open ? Math.round((this.k().overdue / this.k().open) * 100) : 0));
  readonly delta = computed(() => this.k().closedThisWeek - this.k().closedLastWeek);
  readonly deltaText = computed(() => {
    const d = this.delta();
    return d === 0 ? this.i18n.t('sameAsLast') : `${d > 0 ? '+' : ''}${d} ${this.i18n.t('vsLast')}`;
  });
}
