import {InjectionToken} from '@angular/core';
import {makeEnvironmentProviders} from '@angular/core';
import {ActionReducer, provideState, StoreConfig} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {servingFeature, servingFeatureKey, State} from '@common/serving/serving.reducer';
import {ServingEffects} from '@common/serving/serving.effects';
import {singleGraphProviders} from '@common/shared/single-graph/single-graph.providers';
import {UserPreferences} from '@common/user-preferences';
import {createUserPrefFeatureReducer} from '@common/core/meta-reducers/user-pref-reducer';
import {merge, pick} from 'lodash-es';
import {commonProjectsProviders} from '@common/projects/common-projects.providers';

export const servingSyncedKeys = [
  'tableSortFields',
  'columnFilters',
  'columnsWidth',
  'colsOrder',
  'hiddenCharts'
];

export const SERVING_CONFIG_TOKEN =
  new InjectionToken<StoreConfig<State>>('EndpointsConfigToken');

const localStorageKey = '_saved_endpoints_state_';

const getInitState = (userPreferences: UserPreferences) => ({
  metaReducers: [
    (reducer: ActionReducer<State>) => {
      let onInit = true;
      return (state, action) => {
        const nextState = reducer(state, action);
        if (onInit) {
          onInit = false;
          const savedState = JSON.parse(localStorage.getItem(localStorageKey));
          return merge({}, nextState, savedState);
        }
        if (action.type.startsWith(servingFeatureKey)) {
          localStorage.setItem(localStorageKey, JSON.stringify(pick(nextState, ['tableMode', 'hiddenCharts'])));
        }
        return nextState;
      };
    },
    (reducer: ActionReducer<State>) =>
      createUserPrefFeatureReducer(
        servingFeatureKey, servingSyncedKeys, ['[serving]'],
        userPreferences, reducer
      ),
  ]
});

export const servingProviders = makeEnvironmentProviders([
  provideState(servingFeature.name, servingFeature.reducer, SERVING_CONFIG_TOKEN),
  provideEffects([ServingEffects]),
  singleGraphProviders,
  {provide: SERVING_CONFIG_TOKEN, useFactory: getInitState, deps: [UserPreferences]},
]);
