import { Component, computed, inject, input, signal } from '@angular/core';
import { I18n } from '../core/i18n.service';
import { TrendPoint } from '../core/models';

const W = 720, H = 250, L = 34, R = 10, T = 18, B = 28;

/** Closed (bars) vs created (line) per week. Hand-built SVG: one series each, legend always shown. */
@Component({
  selector: 'app-throughput-chart',
  template: `
    <div class="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate">
      <span class="inline-flex items-center gap-2"><i class="inline-block h-3 w-3 rounded-[3px] bg-brand"></i>{{ i18n.t('closed') }}</span>
      <span class="inline-flex items-center gap-2">
        <svg width="22" height="10" aria-hidden="true"><line x1="0" x2="22" y1="5" y2="5" stroke="#010136" stroke-width="2"/><circle cx="11" cy="5" r="4" fill="#010136" stroke="#fff" stroke-width="2"/></svg>
        {{ i18n.t('created') }}
      </span>
    </div>

    <div class="relative mt-2">
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="block h-auto w-full overflow-visible" role="img" [attr.aria-label]="i18n.t('trend')">
        @for (g of grid(); track g.v) {
          <line [attr.x1]="L" [attr.x2]="W - R" [attr.y1]="g.y" [attr.y2]="g.y" stroke="#e6ebf5" />
          <text [attr.x]="L - 8" [attr.y]="g.y + 4" text-anchor="end" class="fill-slate text-[11px]">{{ g.v }}</text>
        }
        @for (p of pts(); track p.i) {
          @if (p.h > 0) {
            <rect [attr.x]="p.x - bw / 2" [attr.y]="p.yc" [attr.width]="bw" [attr.height]="p.h" rx="5" fill="#1f5df9" />
            <rect [attr.x]="p.x - bw / 2" [attr.y]="p.yc + 5" [attr.width]="bw" [attr.height]="max(0, p.h - 5)" fill="#1f5df9" />
          }
        }
        <polyline [attr.points]="line()" fill="none" stroke="#010136" stroke-width="2" stroke-linejoin="round" />
        @for (p of pts(); track p.i) {
          <circle [attr.cx]="p.x" [attr.cy]="p.yr" r="4" fill="#010136" stroke="#fff" stroke-width="2" />
        }
        @for (i of labelled(); track i) {
          <text [attr.x]="pts()[i].x" [attr.y]="pts()[i].yc - 7" text-anchor="middle" class="fill-navy text-[12px] font-semibold">{{ pts()[i].d.closed }}</text>
        }
        @for (p of pts(); track p.i) {
          @if (p.showX) { <text [attr.x]="p.x" [attr.y]="H - 8" text-anchor="middle" class="fill-slate text-[11px]">{{ i18n.date(p.d.weekStart) }}</text> }
        }
        @for (p of pts(); track p.i) {
          <rect tabindex="0" [attr.x]="L + slot() * p.i" [attr.y]="T" [attr.width]="slot()" [attr.height]="H - T - B"
                class="cursor-default fill-transparent hover:fill-navy/5 focus-visible:fill-navy/5 outline-none"
                [attr.aria-label]="i18n.t('weekOf') + ' ' + i18n.date(p.d.weekStart) + ': ' + i18n.t('closed') + ' ' + p.d.closed + ', ' + i18n.t('created') + ' ' + p.d.created"
                (mouseenter)="hover.set(p.i)" (mouseleave)="hover.set(null)" (focus)="hover.set(p.i)" (blur)="hover.set(null)" />
        }
      </svg>

      @if (hover() !== null) {
        <div class="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl bg-navy px-3 py-2 text-xs leading-5 text-white shadow-lg"
             [style.left.%]="(pts()[hover()!].x / W) * 100" style="top: -0.25rem">
          <b>{{ i18n.t('weekOf') }} {{ i18n.date(pts()[hover()!].d.weekStart) }}</b><br>
          {{ i18n.t('closed') }}: <b>{{ pts()[hover()!].d.closed }}</b> &nbsp; {{ i18n.t('created') }}: <b>{{ pts()[hover()!].d.created }}</b>
        </div>
      }

      <table class="sr-only">
        <caption>{{ i18n.t('trend') }}</caption>
        <thead><tr><th>{{ i18n.t('weekOf') }}</th><th>{{ i18n.t('closed') }}</th><th>{{ i18n.t('created') }}</th></tr></thead>
        <tbody>
          @for (p of pts(); track p.i) { <tr><td>{{ i18n.date(p.d.weekStart) }}</td><td>{{ p.d.closed }}</td><td>{{ p.d.created }}</td></tr> }
        </tbody>
      </table>
    </div>
  `,
})
export class ThroughputChartComponent {
  readonly i18n = inject(I18n);
  readonly trend = input.required<TrendPoint[]>();
  readonly hover = signal<number | null>(null);

  readonly W = W; readonly H = H; readonly L = L; readonly R = R; readonly T = T; readonly B = B;
  readonly bw = 26;
  readonly max = Math.max;

  readonly slot = computed(() => (W - L - R) / this.trend().length);
  private readonly top = computed(() => {
    const m = Math.max(...this.trend().map((w) => Math.max(w.closed, w.created)), 1);
    const step = m <= 10 ? 2 : m <= 30 ? 5 : 10;
    return Math.max(step * 2, Math.ceil(m / step) * step);
  });
  private y = (v: number) => T + (H - T - B) - (v / this.top()) * (H - T - B);

  readonly grid = computed(() => [0, 0.5, 1].map((p) => { const v = Math.round(this.top() * p); return { v, y: this.y(v) }; }));
  readonly pts = computed(() => {
    const n = this.trend().length;
    return this.trend().map((d, i) => ({
      i, d,
      x: L + this.slot() * i + this.slot() / 2,
      yc: this.y(d.closed),
      yr: this.y(d.created),
      h: H - B - this.y(d.closed),
      showX: i % 2 === (n - 1) % 2,
    }));
  });
  readonly line = computed(() => this.pts().map((p) => `${p.x},${p.yr}`).join(' '));
  /** Label only the peak and the latest bar. */
  readonly labelled = computed(() => {
    const t = this.trend();
    const peak = t.reduce((m, w, i) => (w.closed > t[m].closed ? i : m), 0);
    return [...new Set([peak, t.length - 1])].filter((i) => t[i].closed > 0);
  });
}
