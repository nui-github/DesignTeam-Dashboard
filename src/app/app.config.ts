import { registerLocaleData } from '@angular/common';
import th from '@angular/common/locales/th';
import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  ArrowUpRight, CalendarClock, Check, ExternalLink, Languages, Lock, LogOut, LucideAngularModule,
  Maximize, MessageSquare, Minimize, RefreshCw, TrendingDown, TrendingUp, TriangleAlert, Users, Video, X,
} from 'lucide-angular';
import { provideNzI18n, th_TH } from 'ng-zorro-antd/i18n';

registerLocaleData(th);

/** Lucide icons used in the app. Add an icon here, then use <lucide-icon name="kebab-case-name" />. */
const ICONS = {
  ArrowUpRight, CalendarClock, Check, ExternalLink, Languages, Lock, LogOut,
  Maximize, MessageSquare, Minimize, RefreshCw, TrendingDown, TrendingUp, TriangleAlert, Users, Video, X,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),
    provideNzI18n(th_TH),
    importProvidersFrom(LucideAngularModule.pick(ICONS)),
  ],
};
