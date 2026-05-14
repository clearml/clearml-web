import {provideState} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {dashboardSearchReducer} from '@common/dashboard-search/dashboard-search.reducer';
import {DashboardSearchEffects as CommonDashboardSearchEffects} from '@common/dashboard-search/dashboard-search.effects';
import {DashboardSearchEffects} from '~/features/dashboard-search/dashboard-search.effects';

export const dashboardSearchProviders = [
  provideState('search', dashboardSearchReducer),
  provideEffects([DashboardSearchEffects, CommonDashboardSearchEffects]),
];
