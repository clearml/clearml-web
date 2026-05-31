import {makeEnvironmentProviders} from '@angular/core';
import {Routes} from '@angular/router';
import {leavingBeforeSaveAlertGuard} from '../shared/guards/leaving-before-save-alert.guard';
import {selectIsExperimentInEditMode, selectLastVisitedTasksTab} from '@common/experiments/reducers';
import {experimentsCompareProviders} from '@common/experiments-compare/experiments-compare.providers';
import {provideState} from '@ngrx/store';
import {selectModelProviders} from '@common/select-model/select-model.providers';
import {compareNavigationGuard} from '@common/experiments/compare-navigation.guard';
import {compareViewStateGuard} from '@common/experiments/compare-view-state.guard';
import {lastVisitedTabGuard} from '@common/shared/guards/last-visted-tab.guard';
import {lastVisitedSettingTabGuard} from '@common/shared/guards/last-visted-set-tab.guard';
import {setLastTasksTab} from '@common/experiments/actions/common-experiments-info.actions';
import {provideEffects} from '@ngrx/effects';
import {EXPERIMENTS_STORE_KEY} from '@common/experiments/experiment.consts';
import {reducers} from '~/features/experiments/reducers';
import {ExperimentsInfoEffects} from '~/features/experiments/effects/experiments-info.effects';
import {ExperimentsMenuEffects} from '~/features/experiments/effects/experiments-menu.effects';
import {CommonExperimentsViewEffects} from '@common/experiments/effects/common-experiments-view.effects';
import {CommonExperimentsInfoEffects} from '@common/experiments/effects/common-experiments-info.effects';
import {CommonExperimentOutputEffects} from '@common/experiments/effects/common-experiment-output.effects';
import {CommonExperimentsMenuEffects} from '@common/experiments/effects/common-experiments-menu.effects';
import {ExperimentConverterService} from '~/features/experiments/shared/services/experiment-converter.service';
import {CommonExperimentConverterService} from '@common/experiments/shared/services/common-experiment-converter.service';
import {singleGraphProviders} from '@common/shared/single-graph/single-graph.providers';
import {selectQueueProviders} from '@common/experiments/shared/components/select-queue/select-queue.providers';

export const commonExperimentsProviders = makeEnvironmentProviders([
  provideState(EXPERIMENTS_STORE_KEY, reducers),
  provideEffects([
    ExperimentsInfoEffects,
    ExperimentsMenuEffects,
    CommonExperimentsViewEffects,
    CommonExperimentsInfoEffects,
    CommonExperimentOutputEffects,
    CommonExperimentsMenuEffects
  ]),
  ExperimentConverterService,
  CommonExperimentConverterService,
  ...selectQueueProviders,
  ...singleGraphProviders,
  ...selectModelProviders,
]);

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@common/experiments/experiments.component').then(m => m.ExperimentsComponent),
    providers: [
      commonExperimentsProviders
    ],
    children: [
      {
        path: 'compare',
        canActivate: [compareNavigationGuard],
        children: []
      },
      {
        path: 'compare/scalars',
        canActivate: [compareViewStateGuard],
        loadComponent: () => import('@common/experiments-compare/containers/experiment-compare-metric-charts/experiment-compare-scalar-charts.component').then(m => m.ExperimentCompareScalarChartsComponent),
        data: {minimized: true},
        providers: [
          experimentsCompareProviders
        ],
      },
      {
        path: 'compare/plots',
        canActivate: [compareViewStateGuard],
        loadComponent: () => import('@common/experiments-compare/containers/experiment-compare-plots/experiment-compare-plots.component').then(m => m.ExperimentComparePlotsComponent),
        data: {minimized: true},
        providers: [
          experimentsCompareProviders
        ],
      },
      {
        path: ':experimentId',
        loadComponent: () =>
          import('~/features/experiments/containers/experiment-ouptut/experiment-output.component').then(m => m.ExperimentOutputComponent),
        canDeactivate: [lastVisitedSettingTabGuard], data: {lastTabAction: setLastTasksTab},
        children: [
          {
            path: '',
            pathMatch: 'full',
            children: [],
            canActivate: [lastVisitedTabGuard],
            data: {lastTabSelector: selectLastVisitedTasksTab}
          },
          {
            path: 'execution',
            loadComponent: () =>
              import('./containers/experiment-info-execution/experiment-info-execution.component').then(m => m.ExperimentInfoExecutionComponent),
            canDeactivate: [leavingBeforeSaveAlertGuard(selectIsExperimentInEditMode)],
            data: {minimized: true}
          },
          {
            path: 'artifacts',
            loadComponent: () =>
              import('./containers/experiment-info-aritfacts/experiment-info-artifacts.component').then(m => m.ExperimentInfoArtifactsComponent),
            canDeactivate: [leavingBeforeSaveAlertGuard(selectIsExperimentInEditMode)],
            data: {minimized: true},
            children: [
              {path: '', redirectTo: 'input-model', pathMatch: 'full'},
              {
                path: 'input-model/:modelId',
                loadComponent: () => import('./containers/experiment-info-model/experiment-info-model.component').then(m => m.ExperimentInfoModelComponent),
                data: {outputModel: false}},
              {
                path: 'output-model/:modelId',
                loadComponent: () => import('./containers/experiment-info-model/experiment-info-model.component').then(m => m.ExperimentInfoModelComponent),
                data: {outputModel: true}
              },
              {
                path: 'artifact/:artifactId',
                children: [{
                  path: ':mode',
                  loadComponent: () => import('./containers/experiment-info-artifact-item/experiment-info-artifact-item.component').then(m => m.ExperimentInfoArtifactItemComponent)
                }]
              },
              {
                path: 'other/:artifactId',
                children: [{
                  path: ':mode',
                  loadComponent: () => import('./containers/experiment-info-artifact-item/experiment-info-artifact-item.component').then(m => m.ExperimentInfoArtifactItemComponent)
                }]
              },

            ]
          },
          {
            path: 'hyper-params',
            loadComponent: () => import('./containers/experiment-info-hyper-parameters/experiment-info-hyper-parameters.component').then(m => m.ExperimentInfoHyperParametersComponent),
            canDeactivate: [leavingBeforeSaveAlertGuard(selectIsExperimentInEditMode)],
            data: {minimized: true},
            children: [
              {
                path: 'configuration/:configObject',
                loadComponent: () => import('./containers/experiment-info-task-model/experiment-info-task-model.component').then(m => m.ExperimentInfoTaskModelComponent)
              },
              {
                path: 'hyper-param/:hyperParamId',
                loadComponent: () => import('./containers/experiment-info-hyper-parameters-form-container/experiment-info-hyper-parameters-form-container.component').then(m => m.ExperimentInfoHyperParametersFormContainerComponent)
              }
            ]
          },
          {
            path: 'general',
            loadComponent: () => import('./containers/experiment-info-general/experiment-info-general.component').then(m => m.ExperimentInfoGeneralComponent),
            data: {minimized: true}
          },
          {
            path: 'scalars', pathMatch: 'full',
            loadComponent: () => import('./containers/experiment-output-scalars/experiment-output-scalars.component').then(m => m.ExperimentOutputScalarsComponent),
            data: {minimized: true}
          },
          {
            path: 'plots', pathMatch: 'full',
            loadComponent: () => import('./containers/experiment-output-plots/experiment-output-plots.component').then(m => m.ExperimentOutputPlotsComponent),
            data: {minimized: true}
          },
          {
            path: 'debugImages',
            loadComponent: () => import('../debug-images/debug-images.component').then(m => m.DebugImagesComponent),
            data: {minimized: true}
          },
          {
            path: 'log', pathMatch: 'full',
            loadComponent: () => import('./containers/experiment-output-log/experiment-output-log.component').then(m => m.ExperimentOutputLogComponent),
            data: {minimized: true}
          },
          {path: 'info-output', redirectTo: ''},
          {path: 'info-output/metrics/scalar', redirectTo: 'scalars'},
          {path: 'info-output/metrics/plots', redirectTo: 'plots'},
          {path: 'metrics/scalar', redirectTo: 'scalars'},
          {path: 'metrics/plots', redirectTo: 'plots'}
        ]
      },
    ]
  },

  {
    path: ':experimentId/output',
    loadComponent: () => import('~/features/experiments/containers/experiment-ouptut/experiment-output.component').then(m => m.ExperimentOutputComponent),
    data: {search: false, lastTabAction: setLastTasksTab},
    canDeactivate: [lastVisitedSettingTabGuard],
    providers: [
      ...singleGraphProviders
    ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        children: [],
        canActivate: [lastVisitedTabGuard],
        data: {lastTabSelector: selectLastVisitedTasksTab}
      },
      {
        path: 'execution',
        loadComponent: () => import('./containers/experiment-info-execution/experiment-info-execution.component').then(m => m.ExperimentInfoExecutionComponent),
        canDeactivate: [leavingBeforeSaveAlertGuard(selectIsExperimentInEditMode)]
      },
      {
        path: 'hyper-params',
        loadComponent: () => import('./containers/experiment-info-hyper-parameters/experiment-info-hyper-parameters.component').then(m => m.ExperimentInfoHyperParametersComponent),
        data: {},
        canDeactivate: [leavingBeforeSaveAlertGuard(selectIsExperimentInEditMode)],
        children: [
          {
            path: 'configuration/:configObject',
            loadComponent: () => import('./containers/experiment-info-task-model/experiment-info-task-model.component').then(m => m.ExperimentInfoTaskModelComponent)
          },
          {
            path: 'hyper-param/:hyperParamId',
            loadComponent: () => import('./containers/experiment-info-hyper-parameters-form-container/experiment-info-hyper-parameters-form-container.component').then(m => m.ExperimentInfoHyperParametersFormContainerComponent)
          }
        ]
      },
      {
        path: 'artifacts',
        loadComponent: () => import('./containers/experiment-info-aritfacts/experiment-info-artifacts.component').then(m => m.ExperimentInfoArtifactsComponent),
        data: {},
        canDeactivate: [leavingBeforeSaveAlertGuard(selectIsExperimentInEditMode)],
        children: [
          {path: '', redirectTo: 'input-model', pathMatch: 'full'},
          {
            path: 'input-model/:modelId',
            loadComponent: () => import('./containers/experiment-info-model/experiment-info-model.component').then(m => m.ExperimentInfoModelComponent),
            data: {outputModel: false}
          },
          {
            path: 'output-model/:modelId',
            loadComponent: () => import('./containers/experiment-info-model/experiment-info-model.component').then(m => m.ExperimentInfoModelComponent),
            data: {outputModel: true}
          },
          {
            path: 'artifact/:artifactId', children: [{
              path: ':mode', loadComponent: () =>
                import('./containers/experiment-info-artifact-item/experiment-info-artifact-item.component').then(m => m.ExperimentInfoArtifactItemComponent)
            }]
          },
          {
            path: 'other/:artifactId', children: [{
              path: ':mode', loadComponent: () =>
                import('./containers/experiment-info-artifact-item/experiment-info-artifact-item.component').then(m => m.ExperimentInfoArtifactItemComponent)
            }]
          }
        ]
      },
      {
        path: 'general',
        loadComponent: () => import('./containers/experiment-info-general/experiment-info-general.component').then(m => m.ExperimentInfoGeneralComponent),
      },
      {
        path: 'scalars',
        loadComponent: () => import('./containers/experiment-output-scalars/experiment-output-scalars.component').then(m => m.ExperimentOutputScalarsComponent),
      },
      {
        path: 'plots',
        loadComponent: () => import('./containers/experiment-output-plots/experiment-output-plots.component').then(m => m.ExperimentOutputPlotsComponent),
      },
      {
        path: 'debugImages',
        loadComponent: () => import('../debug-images/debug-images.component').then(m => m.DebugImagesComponent)
      },
      {
        path: 'log',
        loadComponent: () => import('./containers/experiment-output-log/experiment-output-log.component').then(m => m.ExperimentOutputLogComponent)
      },
      {path: 'metrics/scalar', redirectTo: 'scalars'},
      {path: 'metrics/plots', redirectTo: 'plots'},
    ]
  },
];

