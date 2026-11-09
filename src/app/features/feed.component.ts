import { Component, inject, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { safeUrl } from '../core/format';
import { I18n } from '../core/i18n.service';
import { Activity, Meeting } from '../core/models';

/** Recent meetings (tasks tagged "meeting") and latest comments across the team. */
@Component({
  selector: 'app-feed',
  imports: [LucideAngularModule],
  template: `
    <div class="grid gap-6 lg:grid-cols-2">
      <section class="panel" aria-labelledby="meet-h">
        <h3 id="meet-h" class="flex items-center gap-2.5 text-lg font-semibold"><lucide-icon name="video" [size]="20" class="text-brand" aria-hidden="true" />{{ i18n.t('meetings') }}</h3>
        @if (meetings().length) {
          <ul class="m-0 mt-4 list-none p-0">
            @for (m of meetings(); track m.id) {
              <li class="border-t border-line py-4 first:border-t-0 first:pt-0">
                <div class="font-semibold">
                  @if (url(m.url); as href) { <a [href]="href" target="_blank" rel="noopener" class="text-navy no-underline hover:text-brand">{{ m.name }}</a> } @else { {{ m.name }} }
                </div>
                @if (m.date) { <div class="text-sm text-slate">{{ i18n.date(m.date, { day: 'numeric', month: 'short', year: 'numeric' }) }}</div> }
                @if (m.summary) { <p class="clamp m-0 mt-1.5 text-[.95rem] text-slate">{{ m.summary }}</p> }
                @if (m.attendees.length) {
                  <div class="mt-2 flex flex-wrap gap-1.5" [attr.aria-label]="i18n.t('attendees')">
                    @for (a of m.attendees; track a) { <span class="rounded-full bg-tint px-2.5 py-0.5 text-xs">{{ a }}</span> }
                  </div>
                }
              </li>
            }
          </ul>
        } @else { <p class="mt-4 text-slate">{{ i18n.t('noMeetings') }}</p> }
      </section>

      <section class="panel" aria-labelledby="act-h">
        <h3 id="act-h" class="flex items-center gap-2.5 text-lg font-semibold"><lucide-icon name="message-square" [size]="20" class="text-brand" aria-hidden="true" />{{ i18n.t('activity') }}</h3>
        @if (comments().length) {
          <ul class="m-0 mt-4 list-none p-0">
            @for (c of comments(); track $index) {
              <li class="border-t border-line py-4 first:border-t-0 first:pt-0">
                <div class="font-semibold">{{ c.author || '—' }}</div>
                <div class="text-sm text-slate">
                  @if (c.date) { {{ i18n.dateTime(c.date) }} }
                  {{ i18n.t('onTask') }}
                  @if (url(c.url); as href) { <a [href]="href" target="_blank" rel="noopener" class="text-slate underline hover:text-brand">{{ c.taskName }}</a> } @else { {{ c.taskName }} }
                </div>
                <p class="clamp m-0 mt-1.5 text-[.95rem]">{{ c.text }}</p>
              </li>
            }
          </ul>
        } @else { <p class="mt-4 text-slate">{{ i18n.t('noComments') }}</p> }
      </section>
    </div>
  `,
  styles: `
    .panel { background: #fff; border: 1px solid var(--color-line); border-radius: 1.6rem; padding: 1.5rem 1.6rem 1.6rem; }
    .clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  `,
})
export class FeedComponent {
  readonly i18n = inject(I18n);
  readonly meetings = input.required<Meeting[]>();
  readonly comments = input.required<Activity[]>();
  readonly url = safeUrl;
}
