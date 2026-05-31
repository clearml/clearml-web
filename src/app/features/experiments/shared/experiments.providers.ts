import {InjectionToken, makeEnvironmentProviders} from '@angular/core';
import {CommonExperimentOutputEffects} from '@common/experiments/effects/common-experiment-output.effects';
import {Action, ActionReducer, StoreConfig} from '@ngrx/store';
import {EXPERIMENTS_PREFIX, EXPERIMENTS_STORE_KEY} from '@common/experiments/experiment.consts';
import {CommonExperimentsViewEffects} from '@common/experiments/effects/common-experiments-view.effects';
import {CommonExperimentsInfoEffects} from '@common/experiments/effects/common-experiments-info.effects';
import {CommonExperimentsMenuEffects} from '@common/experiments/effects/common-experiments-menu.effects';
import {CommonExperimentConverterService} from '@common/experiments/shared/services/common-experiment-converter.service';
import {merge, pick} from 'lodash-es';
import {experimentsReducers, ExperimentState} from '~/features/experiments/reducers';
import {ExperimentConverterService} from './services/experiment-converter.service';
import {ExperimentsCompareChartsEffects} from '@common/experiments-compare/effects/experiments-compare-charts.effects';
import {provideState} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {singleGraphProviders} from '@common/shared/single-graph/single-graph.providers';
import {createUserPrefFeatureReducer} from '@common/core/meta-reducers/user-pref-reducer';
import {EXPERIMENTS_OUTPUT_PREFIX} from '@common/experiments/actions/common-experiment-output.actions';
import {EXPERIMENTS_INFO_PREFIX} from '@common/experiments/actions/common-experiments-info.actions';
import {UserPreferences} from '@common/user-preferences';
import {ExperimentsInfoEffects} from '~/features/experiments/effects/experiments-info.effects';
import {debugImagesProviders} from '@common/debug-images/debug-images.providers';

export const EXPERIMENT_CONFIG_TOKEN =
  new InjectionToken<StoreConfig<ExperimentState>>('ExperimentConfigToken');

const localStorageKey = '_saved_experiment_state_';

export const getExperimentsConfig = (userPreferences: UserPreferences): StoreConfig<ExperimentState> => ({
  metaReducers: [
    (reducer: ActionReducer<ExperimentState>) => {
      let onInit = true;
      return (state: ExperimentState, action: Action) => {
        const nextState = reducer(state, action);
        if (onInit) {
          onInit = false;
          const savedState = JSON.parse(localStorage.getItem(localStorageKey));
          return merge({}, nextState, savedState);
        }
        if (action.type.startsWith(EXPERIMENTS_PREFIX)) {
          localStorage.setItem(localStorageKey, JSON.stringify(pick(nextState, [
            'view.tableMode',
            'view.tableCompareView',
            'view.compareSelectedMetrics',
            'view.compareSelectedMetricsPlots'
          ])));
        }
        return nextState;
      };
    },
    (reducer: ActionReducer<ExperimentState>) =>
      createUserPrefFeatureReducer(EXPERIMENTS_STORE_KEY, [], [EXPERIMENTS_PREFIX, EXPERIMENTS_INFO_PREFIX, EXPERIMENTS_OUTPUT_PREFIX], userPreferences, reducer),
  ]
});

export const experimentsProviders = makeEnvironmentProviders([
  provideState(EXPERIMENTS_STORE_KEY, experimentsReducers, EXPERIMENT_CONFIG_TOKEN),
  provideEffects([
    ExperimentsInfoEffects,
    CommonExperimentsViewEffects,
    CommonExperimentsInfoEffects,
    CommonExperimentOutputEffects,
    CommonExperimentsMenuEffects,
    ExperimentsCompareChartsEffects
  ]),
  ...singleGraphProviders,
  ...debugImagesProviders,
  ExperimentConverterService,
  CommonExperimentConverterService,
  {provide: EXPERIMENT_CONFIG_TOKEN, useFactory: getExperimentsConfig, deps: [UserPreferences]},
]);
