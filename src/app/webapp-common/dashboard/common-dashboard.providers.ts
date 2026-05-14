import {provideEffects} from '@ngrx/effects';
import {CommonDashboardEffects} from './common-dashboard.effects';
import {ReportsEffects} from '@common/reports/reports.effects';

export const commonDashboardProviders = [
  provideEffects([CommonDashboardEffects, ReportsEffects]),
];
