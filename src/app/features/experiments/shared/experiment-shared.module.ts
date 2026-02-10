import {InjectionToken, NgModule} from '@angular/core';
import {CommonExperimentOutputEffects} from '@common/experiments/effects/common-experiment-output.effects';
import {ExperimentsMenuEffects} from '~/features/experiments/effects/experiments-menu.effects';
import {Action, ActionReducer, StoreConfig, StoreModule} from '@ngrx/store';
import {ExperimentOutputEffects} from '~/features/experiments/effects/experiment-output.effects';
import {EXPERIMENTS_PREFIX, EXPERIMENTS_STORE_KEY} from '@common/experiments/experiment.consts';
import {CommonExperimentsViewEffects} from '@common/experiments/effects/common-experiments-view.effects';
import {CommonExperimentsInfoEffects} from '@common/experiments/effects/common-experiments-info.effects';
import {CommonExperimentsMenuEffects} from '@common/experiments/effects/common-experiments-menu.effects';
import {CommonExperimentConverterService} from '@common/experiments/shared/services/common-experiment-converter.service';
import {EffectsModule} from '@ngrx/effects';
import {merge, pick} from 'lodash-es';
import {experimentsReducers, ExperimentState} from '~/features/experiments/reducers';
import {ExperimentConverterService} from './services/experiment-converter.service';
import {ExperimentsCompareChartsEffects} from '@common/experiments-compare/effects/experiments-compare-charts.effects';
import {SingleGraphStateModule} from '@common/shared/single-graph/single-graph-state.module';

export const EXPERIMENT_CONFIG_TOKEN =
  new InjectionToken<StoreConfig<ExperimentState>>('ExperimentConfigToken');

const localStorageKey = '_saved_experiment_state_';

export const getExperimentsConfig = () => ({
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


@NgModule({
  imports: [
    StoreModule.forFeature(EXPERIMENTS_STORE_KEY, experimentsReducers, EXPERIMENT_CONFIG_TOKEN),
    EffectsModule.forFeature([
      ExperimentOutputEffects, ExperimentsMenuEffects,
      CommonExperimentsViewEffects,
      CommonExperimentsInfoEffects,
      CommonExperimentOutputEffects,
      CommonExperimentsMenuEffects,
      ExperimentsCompareChartsEffects
    ]),
    SingleGraphStateModule,
  ],
  providers: [
    ExperimentConverterService,
    CommonExperimentConverterService,
    {provide: EXPERIMENT_CONFIG_TOKEN, useFactory: getExperimentsConfig},
  ],
})
export class ExperimentSharedModule {
}
