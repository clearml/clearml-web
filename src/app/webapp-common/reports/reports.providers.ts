import {InjectionToken} from '@angular/core';
import {makeEnvironmentProviders} from '@angular/core';
import {ActionReducer, provideState, StoreConfig} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {REPORTS_KEY, reportsReducer, ReportsState} from './reports.reducer';
import {ReportsEffects} from './reports.effects';
import {UserPreferences} from '@common/user-preferences';
import {createUserPrefFeatureReducer} from '@common/core/meta-reducers/user-pref-reducer';
import {REPORTS_PREFIX} from '@common/reports/reports.actions';
import {commonProjectsProviders} from '@common/projects/common-projects.providers';

const reportsSyncedKeys = ['orderBy', 'sortOrder'];
export const REPORTS_STORE_CONFIG_TOKEN =
  new InjectionToken<StoreConfig<ReportsState>>('DatasetsConfigToken');

const getInitState = (userPreferences: UserPreferences) => ({
  metaReducers: [
    (reducer: ActionReducer<ReportsState>) =>
      createUserPrefFeatureReducer(REPORTS_KEY, reportsSyncedKeys, [REPORTS_PREFIX], userPreferences, reducer),
  ]
});

export const reportsProviders = makeEnvironmentProviders([
  provideState(REPORTS_KEY, reportsReducer, REPORTS_STORE_CONFIG_TOKEN),
  provideEffects([ReportsEffects]),
  ...commonProjectsProviders,
  {provide: REPORTS_STORE_CONFIG_TOKEN, useFactory: getInitState, deps: [UserPreferences]},
]);
