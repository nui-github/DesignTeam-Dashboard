import { Component, computed, inject, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { GROUP_COLOR, dueLabel, safeUrl } from '../core/format';
import { I18n } from '../core/i18n.service';
import { GROUPS, Group, Person } from '../core/models';

/** Right-hand drawer (ng-zorro) with every task of one person, grouped by status. */
@Component({
  selector: 'app-member-drawer',
  imports: [NzDrawerModule, LucideAngularModule],
  template: `
    <nz-drawer [nzVisible]="!!person()" [nzClosable]="false" nzPlacement="right" [nzWidth]="'min(36rem, 100vw)'"
               [nzBodyStyle]="{ padding: '0' }" (nzOnClose)="close.emit()">
      <ng-container *nzDrawerContent>
        @if (person(); as p) {
          <div class="relative bg-tint px-7 pb-6 pt-7">
            <button type="button" (click)="close.emit()" [attr.aria-label]="i18n.t('close')"
                    class="absolute right-4 top-4 grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-line bg-white text-navy hover:border-brand">
              <lucide-icon name="x" [size]="18" />
            </button>
            <div class="flex items-center gap-4">
              <span class="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-gradient p-[2.5px]">
                <span class="grid h-full w-full place-items-center overflow-hidden rounded-full bg-navy font-bold text-white">
                  @if (p.avatar) { <img [src]="p.avatar" alt="" class="h-full w-full object-cover" referrerpolicy="no-referrer"> } @else { {{ p.initials }} }
                </span>
              </span>
              <div class="min-w-0">
                <h2 class="m-0 text-2xl font-bold leading-tight tracking-tight">{{ name() }}</h2>
                @if (p.email) { <div class="truncate text-sm text-slate">{{ p.email }}</div> }
              </div>
            </div>
            <div class="mt-6 grid grid-cols-4 gap-2">
              <div><b class="n block">{{ p.open }}</b><span class="lbl">{{ i18n.t('nOpen') }}</span></div>
              <div><b class="n block" [class.text-critical]="p.overdue > 0">{{ p.overdue }}</b><span class="lbl">{{ i18n.t('nOverdue') }}</span></div>
              <div><b class="n block">{{ p.dueThisWeek }}</b><span class="lbl">{{ i18n.t('nWeek') }}</span></div>
              <div><b class="n block">{{ pct() }}%</b><span class="lbl">{{ i18n.t('rate') }}</span></div>
            </div>
          </div>

          <div class="px-7 pb-10">
            @if (p.projects.length) {
              <h3 class="sect">{{ i18n.t('projects') }}</h3>
              <div class="flex flex-wrap gap-1.5">
                @for (pr of p.projects; track pr.name) {
                  <span class="rounded-full bg-tint px-3 py-0.5 text-xs text-navy">{{ pr.name }} <b>{{ pr.count }}</b></span>
                }
              </div>
            }

            @for (grp of grouped(); track grp.g) {
              <h3 class="sect flex items-center gap-2">
                <i class="inline-block h-3 w-3 rounded-[3px]" [style.background]="color[grp.g]"></i>
                {{ i18n.t(grp.g === 'done' ? 'recentlyDone' : 'g_' + grp.g) }}
                @if (grp.g !== 'done') { <span class="font-normal text-slate">{{ grp.items.length }}</span> }
              </h3>
              <ul class="m-0 list-none p-0">
                @for (t of grp.items; track t.id) {
                  <li class="grid grid-cols-[1fr_auto] gap-x-4 border-t border-line py-2.5 text-sm">
                    @if (url(t.url); as href) {
                      <a [href]="href" target="_blank" rel="noopener" class="inline-flex items-start gap-1.5 font-medium text-navy no-underline hover:text-brand">
                        {{ t.name }}<lucide-icon name="arrow-up-right" [size]="14" class="mt-1 shrink-0 text-slate" aria-hidden="true" />
                      </a>
                    } @else { <span class="font-medium">{{ t.name }}</span> }
                    <span class="row-span-2 self-center whitespace-nowrap text-right text-sm" [class.font-semibold]="t.due.late" [class.text-critical]="t.due.late" [class.text-slate]="!t.due.late">{{ t.due.text }}</span>
                    <span class="text-xs text-slate">{{ t.meta }}</span>
                  </li>
                }
              </ul>
            }
          </div>
        }
      </ng-container>
    </nz-drawer>
  `,
  styles: `
    .n { font-size: 1.7rem; font-weight: 700; line-height: 1.1; letter-spacing: -.02em; }
    .lbl { display: block; font-size: .8rem; color: var(--color-slate); }
    .sect { margin: 1.9rem 0 .6rem; font-size: 1rem; font-weight: 600; }
  `,
})
export class MemberDrawerComponent {
  readonly i18n = inject(I18n);
  readonly person = input<Person | null>(null);
  readonly close = output<void>();
  readonly color = GROUP_COLOR;
  readonly url = safeUrl;
  readonly name = computed(() => (this.person()?.id === 'unassigned' ? this.i18n.t('unassigned') : this.person()?.name ?? ''));
  readonly pct = computed(() => Math.round((this.person()?.completionRate ?? 0) * 100));

  readonly grouped = computed(() => {
    const p = this.person();
    if (!p) return [];
    return GROUPS.map((g: Group) => ({
      g,
      items: p.tasks.filter((t) => t.group === g).map((t) => ({
        ...t,
        due: dueLabel(t, this.i18n),
        meta: [t.folder || t.list, t.priority ? this.i18n.t('p_' + t.priority) : '', t.status].filter(Boolean).join(' · '),
      })),
    })).filter((x) => x.items.length);
  });
}
