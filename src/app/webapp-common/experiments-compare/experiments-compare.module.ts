import {InjectionToken, NgModule} from '@angular/core';
import {ExperimentsCompareRoutingModule} from './experiments-compare-routing.module';
import {ActionReducer, StoreConfig, StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {experimentsCompareReducers} from './reducers';
import {ExperimentsCompareDetailsEffects} from './effects/experiments-compare-details.effects';
import {ExperimentsCompareChartsEffects} from './effects/experiments-compare-charts.effects';
import {ExperimentsCompareMetricsValuesEffects} from './effects/experiments-compare-metrics-values.effects';
import {ExperimentSharedModule} from '~/features/experiments/shared/experiment-shared.module';

import {DebugImagesModule} from '../debug-images/debug-images.module';
import {SelectCompareHeaderEffects} from './effects/select-experiment-for-compare-effects.service';
import {ExperimentsCompareScalarsGraphEffects} from './effects/experiments-compare-scalars-graph.effects';
import {ExperimentsCompareParamsEffects} from './effects/experiments-compare-params.effects';
import {IExperimentCompareChartsState} from '@common/experiments-compare/reducers/experiments-compare-charts.reducer';
import {UserPreferences} from '@common/user-preferences';
import {merge, pick} from 'lodash-es';
import {createUserPrefFeatureReducer} from '@common/core/meta-reducers/user-pref-reducer';
import {
  EXPERIMENTS_COMPARE_METRICS_CHARTS_
} from '@common/experiments-compare/actions/experiments-compare-charts.actions';
import {EXPERIMENTS_COMPARE_SELECT_EXPERIMENT_} from '@common/experiments-compare/actions/compare-header.actions';
import {SelectModelModule} from '@common/select-model/select-model.module';
import {SingleGraphStateModule} from '@common/shared/single-graph/single-graph-state.module';


export const COMPARE_STORE_KEY = 'experimentsCompare';
export const COMPARE_CONFIG_TOKEN =
  new InjectionToken<StoreConfig<IExperimentCompareChartsState>>('CompareConfigToken');

export const compareSyncedKeys = [];

const localStorageKey = '_saved_compare_state_';

export const getCompareConfig = (userPreferences: UserPreferences) => ({
  metaReducers: [
    reducer => {
      let onInit = true;
      return (state, action) => {
        const nextStateOrg = reducer(state, action);
        let nextState = nextStateOrg;
        if (onInit) {
          onInit = false;
          const savedState = JSON.parse(localStorage.getItem(localStorageKey));
          // Migration to object settings
          if (Array.isArray(savedState?.charts?.settingsList)) {
            nextState = {
              ...nextStateOrg,
              charts: {
                ...nextStateOrg.charts,
                settingsList: savedState.charts.settingsList.reduce((acc, setting) => {
                  acc[setting.id] = setting;
                  return acc;
                }, {})
              }
            };
          }

          return merge({}, nextState, savedState);
        }
        if (action.type.startsWith('EXPERIMENTS_COMPARE_')) {
          localStorage.setItem(localStorageKey, JSON.stringify(pick(nextState, ['charts.settingsList', 'charts.scalarsHoverMode', 'compareHeader.hideIdenticalRows'])));
        }
        return nextState;
      }
        ;
    },
    (reducer: ActionReducer<any>) =>
      createUserPrefFeatureReducer(COMPARE_STORE_KEY, compareSyncedKeys, [EXPERIMENTS_COMPARE_METRICS_CHARTS_, EXPERIMENTS_COMPARE_SELECT_EXPERIMENT_], userPreferences, reducer),
  ]
});

@NgModule({
  imports: [
    DebugImagesModule,
    ExperimentSharedModule,
    SingleGraphStateModule,
    SelectModelModule,
    ExperimentsCompareRoutingModule,
    StoreModule.forFeature(COMPARE_STORE_KEY, experimentsCompareReducers, COMPARE_CONFIG_TOKEN),
    EffectsModule.forFeature([
      ExperimentsCompareDetailsEffects,
      ExperimentsCompareParamsEffects,
      ExperimentsCompareChartsEffects,
      ExperimentsCompareMetricsValuesEffects,
      SelectCompareHeaderEffects,
      ExperimentsCompareScalarsGraphEffects
    ]),
  ],
  providers: [
    {provide: COMPARE_CONFIG_TOKEN, useFactory: getCompareConfig, deps: [UserPreferences]},
  ],
})
export class ExperimentsCompareModule {
}

