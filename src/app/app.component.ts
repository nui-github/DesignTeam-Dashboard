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
        <app-hero [k]="d.kpi" />

        <div class="mx-auto max-w-[88rem] px-6 lg:px-10">
          <section class="grid gap-6 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]" [attr.aria-label]="i18n.t('trend')">
            <div class="rounded-[1.6rem] border border-line bg-white p-6">
              <h2 class="m-0 text-xl font-bold tracking-tight text-brand">{{ i18n.t('trend') }}</h2>
              <p class="mt-1 text-sm text-slate">{{ i18n.t('trendSub') }}</p>
              <app-throughput-chart [trend]="d.trend" />
            </div>
            <div class="rounded-[1.6rem] border border-line bg-white p-6"><app-status-panel [k]="d.kpi" /></div>
          </section>

          <section class="mt-14" aria-labelledby="team-h">
            <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="team-h" class="m-0 text-3xl font-bold tracking-tight text-brand">{{ i18n.t('team') }}</h2>
                <p class="mt-1 text-sm text-slate">{{ i18n.t('teamHint') }}</p>
              </div>
              <nz-segmented [nzOptions]="sortOptions()" [ngModel]="sort()" (ngModelChange)="sort.set($any($event))" [attr.aria-label]="i18n.t('sort')" />
            </div>
            <div class="grid grid-cols-[repeat(auto-fill,minmax(21rem,1fr))] gap-5">
              @for (p of sorted(); track p.id) { <app-member-card [p]="p" (select)="selected.set(p)" /> }
              @if (d.unassigned; as u) { <app-member-card [p]="u" (select)="selected.set(u)" /> }
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

  readonly sorted = computed(() => {
    const us = [...(this.svc.data()?.users ?? [])];
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
