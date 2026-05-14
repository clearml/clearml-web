import {InjectionToken} from '@angular/core';
import {CommonExperimentOutputEffects} from '@common/experiments/effects/common-experiment-output.effects';
import {ExperimentsMenuEffects} from '~/features/experiments/effects/experiments-menu.effects';
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

export const EXPERIMENT_CONFIG_TOKEN =
  new InjectionToken<StoreConfig<ExperimentState>>('ExperimentConfigToken');

const localStorageKey = '_saved_experiment_state_';

export const getExperimentsConfig = (): StoreConfig<ExperimentState> => ({
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
  ]
});

export const experimentSharedProviders = [
  provideState(EXPERIMENTS_STORE_KEY, experimentsReducers, EXPERIMENT_CONFIG_TOKEN),
  provideEffects([
    ExperimentsMenuEffects,
    CommonExperimentsViewEffects,
    CommonExperimentsInfoEffects,
    CommonExperimentOutputEffects,
    CommonExperimentsMenuEffects,
    ExperimentsCompareChartsEffects
  ]),
  ExperimentConverterService,
  CommonExperimentConverterService,
  {provide: EXPERIMENT_CONFIG_TOKEN, useFactory: getExperimentsConfig},
  ...singleGraphProviders,
];
