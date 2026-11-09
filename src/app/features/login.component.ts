import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { LucideAngularModule } from 'lucide-angular';
import { DashboardService } from '../core/dashboard.service';
import { I18n } from '../core/i18n.service';

/** Shown only when the API answers 401 (DASHBOARD_PASSWORD is set on the server). */
@Component({
  selector: 'app-login',
  imports: [FormsModule, NzButtonModule, NzInputModule, LucideAngularModule],
  template: `
    <form class="mx-auto mt-24 max-w-md rounded-[1.6rem] border border-line bg-white p-8" (ngSubmit)="submit()">
      <span class="grid h-12 w-12 place-items-center rounded-2xl bg-navy text-mint"><lucide-icon name="lock" [size]="22" aria-hidden="true" /></span>
      <h1 class="m-0 mt-5 text-2xl font-bold tracking-tight">{{ i18n.t('loginTitle') }}</h1>
      <p class="mt-1 text-slate">{{ i18n.t('loginHint') }}</p>
      <label class="mt-6 block text-sm font-medium" for="pw">{{ i18n.t('password') }}</label>
      <input nz-input nzSize="large" id="pw" name="pw" type="password" autocomplete="current-password" class="mt-1.5" [(ngModel)]="pw" required autofocus />
      @if (svc.error()?.auth) { <p class="mt-2 text-sm text-critical" role="alert">{{ i18n.t('wrongPw') }}</p> }
      <button nz-button nzType="primary" nzSize="large" nzBlock class="mt-5" type="submit" [nzLoading]="svc.loading()">{{ i18n.t('enter') }}</button>
    </form>
  `,
})
export class LoginComponent {
  readonly i18n = inject(I18n);
  readonly svc = inject(DashboardService);
  readonly pw = signal('');
  submit() { if (this.pw()) void this.svc.setPassword(this.pw()); }
}
