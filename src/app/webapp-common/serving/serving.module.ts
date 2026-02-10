import {InjectionToken, NgModule} from '@angular/core';
import {ServingRouterModule} from './serving-routing.module';
import {EffectsModule} from '@ngrx/effects';
import {ActionReducer, StoreConfig, StoreModule} from '@ngrx/store';
import {ExperimentSharedModule} from '~/features/experiments/shared/experiment-shared.module';
import {AngularSplitModule} from 'angular-split';
import {merge, pick} from 'lodash-es';
import {createUserPrefFeatureReducer} from '@common/core/meta-reducers/user-pref-reducer';
import {UserPreferences} from '@common/user-preferences';
import {servingFeature, servingFeatureKey, State} from '@common/serving/serving.reducer';
import {ServingEffects} from '@common/serving/serving.effects';
import {SingleGraphStateModule} from '@common/shared/single-graph/single-graph-state.module';


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
    reducer => {
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


@NgModule({
  imports: [
    ExperimentSharedModule,
    AngularSplitModule,
    SingleGraphStateModule,
    ServingRouterModule,
    StoreModule.forFeature(servingFeature.name, servingFeature.reducer, SERVING_CONFIG_TOKEN),
    EffectsModule.forFeature(ServingEffects),
  ],
  providers: [
    {provide: SERVING_CONFIG_TOKEN, useFactory: getInitState, deps: [UserPreferences]},
  ],
})
export class ServingModule {
}
