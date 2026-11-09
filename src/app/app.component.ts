import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { DashboardService } from './core/dashboard.service';
import { I18n } from './core/i18n.service';
import { Person } from './core/models';
import { FeedComponent } from './features/feed.component';
import { HeroComponent } from './features/hero.component';
import { LoginComponent } from './features/login.component';
import { MemberCardComponent } from './features/member-card.component';
import { MemberDrawerComponent } from './features/member-drawer.component';
import { StatusPanelComponent } from './features/status-panel.component';
import { ThroughputChartComponent } from './features/throughput-chart.component';

type Sort = 'open' | 'overdue' | 'name';

@Component({
  selector: 'app-root',
  imports: [
    FormsModule, LucideAngularModule, NzButtonModule, NzSegmentedModule, NzSkeletonModule,
    HeroComponent, ThroughputChartComponent, StatusPanelComponent, MemberCardComponent, MemberDrawerComponent, FeedComponent, LoginComponent,
  ],
  template: `
    @if (svc.data()?.mode === 'demo') {
      <div class="no-print bg-navy px-4 py-1.5 text-center text-sm font-medium text-mint">{{ i18n.t('demo') }}</div>
    }

    <header class="relative z-10 mx-auto flex max-w-[88rem] flex-wrap items-center justify-between gap-4 px-6 pt-5 lg:px-10">
      <div class="flex items-center gap-3">
        <svg class="h-9 w-9" viewBox="0 0 32 32" aria-hidden="true">
          <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1F5DF9"/><stop offset="1" stop-color="#16EA9E"/></linearGradient></defs>
          <rect width="32" height="32" rx="9" fill="#010136"/>
          <path d="M9 22V10h6.5a6 6 0 0 1 0 12H9Z" fill="none" stroke="url(#lg)" stroke-width="3.2" stroke-linejoin="round"/>
        </svg>
        <div class="leading-tight">
          <div class="text-lg font-bold tracking-tight">{{ i18n.t('title') }}</div>
          <div class="text-xs text-slate">{{ i18n.t('subtitle') }}</div>
        </div>
      </div>

      <div class="no-print flex flex-wrap items-center gap-2">
        @if (svc.data(); as d) {
          <span class="mr-2 hidden items-center gap-2 text-xs text-slate sm:inline-flex" aria-live="polite">
            <i class="si si-clickup text-base" aria-hidden="true"></i>
            {{ i18n.t('updated') }} {{ i18n.dateTime(d.generatedAt) }}
          </span>
          <button nz-button nzType="primary" nzShape="round" type="button" [nzLoading]="svc.loading()" (click)="svc.load(true)">
            <lucide-icon name="refresh-cw" [size]="15" class="mr-1.5 inline-block align-[-2px]" aria-hidden="true" />{{ i18n.t('refresh') }}
          </button>
        }
        <button nz-button nzType="text" nzShape="round" type="button" (click)="i18n.toggle()" [attr.aria-label]="'Language'">
          <lucide-icon name="languages" [size]="16" class="mr-1.5 inline-block align-[-3px]" aria-hidden="true" />{{ i18n.t('lang') }}
        </button>
        <button nz-button nzType="text" nzShape="round" type="button" (click)="toggleFullscreen()">
          <lucide-icon [name]="full() ? 'minimize' : 'maximize'" [size]="16" class="mr-1.5 inline-block align-[-3px]" aria-hidden="true" />{{ full() ? i18n.t('exitFullscreen') : i18n.t('fullscreen') }}
        </button>
        @if (svc.data() && hasPassword) {
          <button nz-button nzType="text" nzShape="round" type="button" (click)="svc.logout()" [attr.aria-label]="i18n.t('logout')"><lucide-icon name="log-out" [size]="16" aria-hidden="true" /></button>
        }
      </div>
    </header>

    <main class="pb-20" [attr.aria-busy]="svc.loading() && !svc.data()">
      @let d = svc.data();
      @let e = svc.error();
      @if (svc.needsLogin()) {
        <app-login />
      } @else if (d) {
        <app-hero [k]="d.kpi" [sprint]="d.scope.sprint" />

        <div class="mx-auto max-w-[88rem] px-6 lg:px-10">
          <section class="grid gap-6 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]" [attr.aria-label]="i18n.t('trend')">
            <div class="rounded-[1.6rem] border border-line bg-white p-6">
              <h2 class="m-0 text-xl font-bold tracking-tight text-brand">{{ i18n.t('trend') }}</h2>
              <p class="mt-1 text-sm text-slate">{{ i18n.t('trendSub') }}</p>
              <app-throughput-chart [trend]="d.trend" />
            </div>
            <div class="rounded-[1.6rem] border border-line bg-white p-6"><app-status-panel [k]="d.kpi" [sprint]="d.scope.sprint" [cancelled]="d.cancelled" /></div>
          </section>

          <section class="mt-14" aria-labelledby="team-h">
            <div class="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div>
                <h2 id="team-h" class="m-0 text-3xl font-bold tracking-tight text-brand">{{ i18n.t('team') }}</h2>
                <p class="mt-1 text-sm text-slate">
                  @if (d.scope.sprint) { <b class="font-semibold text-navy">{{ i18n.t('inScope', { name: d.scope.sprint }) }}</b> &nbsp; }{{ i18n.t('teamHint') }}
                </p>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm text-slate">{{ i18n.t('sort') }}</span>
                <nz-segmented [nzOptions]="sortOptions()" [ngModel]="sort()" (ngModelChange)="sort.set($any($event))" [attr.aria-label]="i18n.t('sort')" />
              </div>
            </div>

            <!-- People filter: every person is one tap, several can be on at once -->
            <div class="mb-6 flex flex-wrap items-center gap-2" role="group" [attr.aria-label]="i18n.t('filterPeople')">
              <button type="button" class="chip" [class.on]="!picked().length" [attr.aria-pressed]="!picked().length" (click)="clearPicked()">
                <lucide-icon name="users" [size]="16" aria-hidden="true" />
                {{ i18n.t('allPeople') }}
                <span class="cnt">{{ peopleOptions().length }}</span>
              </button>
              @for (o of peopleOptions(); track o.id) {
                <button type="button" class="chip" [class.on]="isPicked(o.id)" [attr.aria-pressed]="isPicked(o.id)" [title]="o.name" (click)="togglePicked(o.id)">
                  <span class="av" aria-hidden="true">
                    @if (o.avatar) { <img [src]="o.avatar" alt="" referrerpolicy="no-referrer"> } @else { {{ o.initials }} }
                  </span>
                  {{ o.short }}
                  @if (isPicked(o.id)) { <lucide-icon name="check" [size]="15" aria-hidden="true" /> }
                </button>
              }
              @if (picked().length) {
                <span class="ml-1 text-sm text-slate" aria-live="polite">{{ i18n.t('showingN', { n: picked().length, total: peopleOptions().length }) }}</span>
                <button type="button" class="clear" (click)="clearPicked()">{{ i18n.t('clearFilter') }}</button>
              }
            </div>
            <!-- min-h: keeps the page from jumping when a filter leaves only one row of cards -->
            <div class="grid min-h-[26rem] grid-cols-[repeat(auto-fill,minmax(min(21rem,100%),1fr))] content-start gap-5">
              @for (p of sorted(); track p.id) { <app-member-card [p]="p" (select)="selected.set(p)" /> }
              @if (d.unassigned; as u) {
                @if (!picked().length || picked().includes('unassigned')) { <app-member-card [p]="u" (select)="selected.set(u)" /> }
              }
            </div>
          </section>

          <section class="mt-14" aria-label="Meetings and activity">
            <app-feed [meetings]="d.meetings" [comments]="d.comments" />
          </section>
        </div>

        <app-member-drawer [person]="selected()" (close)="selected.set(null)" />
      } @else if (e) {
        <div class="mx-auto mt-20 max-w-xl px-6" role="alert">
          <h2 class="m-0 text-2xl font-bold">{{ i18n.t('errTitle') }}</h2>
          <p class="mt-2 text-slate">{{ e.message }}</p>
          @if (e.hint) { <p class="text-slate">{{ e.hint }}</p> }
          <button nz-button nzType="primary" nzShape="round" class="mt-4" type="button" (click)="svc.load(true)">{{ i18n.t('retry') }}</button>
        </div>
      } @else {
        <div class="mx-auto mt-16 max-w-[88rem] px-6 lg:px-10" aria-live="polite">
          <p class="mb-6 text-slate">{{ i18n.t('loading') }}</p>
          <nz-skeleton [nzActive]="true" [nzParagraph]="{ rows: 6 }" />
        </div>
      }
    </main>
  `,
  styles: `
    .chip {
      display: inline-flex; align-items: center; gap: .5rem; height: 2.6rem; padding: 0 .95rem 0 .4rem;
      border: 1px solid var(--color-line); border-radius: 999px; background: #fff; color: var(--color-navy);
      font-size: .95rem; font-weight: 500; cursor: pointer; transition: background .15s, border-color .15s, color .15s, transform .1s;
    }
    .chip:first-child { padding-left: .95rem; }
    .chip:hover { border-color: var(--color-brand); }
    .chip:active { transform: scale(.97); }
    .chip.on { background: var(--color-navy); border-color: var(--color-navy); color: #fff; }
    .chip .av {
      display: grid; place-items: center; width: 1.8rem; height: 1.8rem; border-radius: 50%; overflow: hidden;
      background: var(--color-tint); color: var(--color-navy); font-size: .7rem; font-weight: 700;
    }
    .chip .av img { width: 100%; height: 100%; object-fit: cover; }
    .chip.on .av { background: var(--color-mint); }
    .chip .cnt { min-width: 1.4rem; padding: 0 .4rem; border-radius: 999px; background: var(--color-tint); font-size: .75rem; line-height: 1.4rem; text-align: center; }
    .chip.on .cnt { background: rgb(255 255 255 / .18); }
    .clear { border: 0; background: none; padding: .25rem .4rem; color: var(--color-brand); font-size: .9rem; font-weight: 500; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
  `,
})
export class AppComponent implements OnInit {
  readonly svc = inject(DashboardService);
  readonly i18n = inject(I18n);
  readonly sort = signal<Sort>('open');
  readonly selected = signal<Person | null>(null);
  readonly full = signal(false);
  readonly hasPassword = !!sessionStorageGet('dashboard-key');

  readonly sortOptions = computed(() => [
    { label: this.i18n.t('s_open'), value: 'open' },
    { label: this.i18n.t('s_overdue'), value: 'overdue' },
    { label: this.i18n.t('s_name'), value: 'name' },
  ]);

  /** Ids chosen in the people filter. Empty = everyone. */
  readonly picked = signal<string[]>([]);
  readonly peopleOptions = computed(() => {
    const d = this.svc.data();
    const people = [...(d?.users ?? [])].sort((a, b) => a.name.localeCompare(b.name)).map((u) => ({
      id: u.id, name: u.name, short: u.name.split(/\s+/)[0], initials: u.initials, avatar: u.avatar ?? null,
    }));
    return d?.unassigned
      ? [...people, { id: 'unassigned', name: this.i18n.t('unassigned'), short: this.i18n.t('unassigned'), initials: '–', avatar: null }]
      : people;
  });
  isPicked(id: string) { return this.picked().includes(id); }
  togglePicked(id: string) { this.picked.update((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])); }
  clearPicked() { this.picked.set([]); }

  readonly sorted = computed(() => {
    const pick = this.picked();
    const us = [...(this.svc.data()?.users ?? [])].filter((u) => !pick.length || pick.includes(u.id));
    switch (this.sort()) {
      case 'overdue': return us.sort((a, b) => b.overdue - a.overdue || b.open - a.open);
      case 'name': return us.sort((a, b) => a.name.localeCompare(b.name));
      default: return us.sort((a, b) => b.open - a.open || a.name.localeCompare(b.name));
    }
  });

  ngOnInit() {
    document.documentElement.lang = this.i18n.lang();
    document.addEventListener('fullscreenchange', () => this.full.set(!!document.fullscreenElement));
    this.svc.start();
  }

  toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }
}

function sessionStorageGet(k: string) {
  try { return sessionStorage.getItem(k); } catch { return null; }
}
