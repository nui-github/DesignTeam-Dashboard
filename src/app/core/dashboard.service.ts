import { Injectable, signal } from '@angular/core';
import { DashboardData } from './models';

export interface LoadError { message: string; hint?: string | null; auth?: boolean }

const KEY = 'dashboard-key';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  readonly data = signal<DashboardData | null>(null);
  readonly loading = signal(false);
  readonly error = signal<LoadError | null>(null);
  /** Set when the API says a password is needed. */
  readonly needsLogin = signal(false);

  private key = read();
  private timer?: ReturnType<typeof setInterval>;

  start() {
    void this.load();
    // Keep a wall display fresh. The API caches for ~60s, so this is cheap.
    this.timer ??= setInterval(() => void this.load(false, true), 5 * 60 * 1000);
  }

  setPassword(pw: string) {
    this.key = pw;
    try { sessionStorage.setItem(KEY, pw); } catch { /* storage unavailable */ }
    return this.load(true);
  }

  logout() {
    this.key = '';
    try { sessionStorage.removeItem(KEY); } catch { /* storage unavailable */ }
    this.data.set(null);
    this.needsLogin.set(true);
  }

  async load(force = false, silent = false) {
    if (!silent) this.loading.set(true);
    try {
      const res = await fetch(`/api/dashboard${force ? '?refresh=1' : ''}`, {
        headers: this.key ? { 'x-dashboard-key': this.key } : {},
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        this.needsLogin.set(true);
        this.error.set(this.key ? { message: 'wrong-password', auth: true } : null);
        return;
      }
      if (!res.ok) throw Object.assign(new Error(body.error || res.statusText), { hint: body.hint });
      this.needsLogin.set(false);
      this.error.set(null);
      this.data.set(body as DashboardData);
    } catch (e) {
      const err = e as Error & { hint?: string };
      // Keep showing the last good data if a background refresh fails.
      if (!this.data()) this.error.set({ message: err.message, hint: err.hint });
    } finally {
      this.loading.set(false);
    }
  }
}

function read() {
  try { return sessionStorage.getItem(KEY) ?? ''; } catch { return ''; }
}
