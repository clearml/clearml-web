import {importProvidersFrom, NgModule} from '@angular/core';
import {CommonDeleteDialogModule} from '@common/shared/entity-page/entity-delete/common-delete-dialog.module';
import {ExperimentSharedModule} from '~/features/experiments/shared/experiment-shared.module';
import {RouterModule, Routes} from '@angular/router';
import {SelectQueueModule} from '@common/experiments/shared/components/select-queue/select-queue.module';
import {compareNavigationGuard} from '@common/experiments/compare-navigation.guard';
import {compareViewStateGuard} from '@common/experiments/compare-view-state.guard';
import {
  COMPARE_CONFIG_TOKEN,
  COMPARE_STORE_KEY,
  getCompareConfig
} from '@common/experiments-compare/experiments-compare.module';
import {UserPreferences} from '@common/user-preferences';
import {StoreModule} from '@ngrx/store';
import {experimentsCompareReducers} from '@common/experiments-compare/reducers';
import {SingleGraphStateModule} from '@common/shared/single-graph/single-graph-state.module';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./controllers.component').then(m => m.ControllersComponent),
    children: [
      {
        path: 'compare',
        canActivate: [compareNavigationGuard],
        children: []
      },
      {
        path: 'compare/scalars',
        canActivate: [compareViewStateGuard],
        loadComponent: () =>
          import('@common/experiments-compare/containers/experiment-compare-metric-charts/experiment-compare-scalar-charts.component').then(m => m.ExperimentCompareScalarChartsComponent),
        data: {minimized: true},
        providers: [
          {provide: COMPARE_CONFIG_TOKEN, useFactory: getCompareConfig, deps: [UserPreferences]},
          importProvidersFrom(
            StoreModule.forFeature(COMPARE_STORE_KEY, experimentsCompareReducers, COMPARE_CONFIG_TOKEN),
          ),
        ],
      },
      {
        path: 'compare/plots',
        canActivate: [compareViewStateGuard],
        loadComponent: () => import('@common/experiments-compare/containers/experiment-compare-plots/experiment-compare-plots.component').then(m => m.ExperimentComparePlotsComponent),
        data: {minimized: true},
        providers: [
          {provide: COMPARE_CONFIG_TOKEN, useFactory: getCompareConfig, deps: [UserPreferences]},
          importProvidersFrom(
            StoreModule.forFeature(COMPARE_STORE_KEY, experimentsCompareReducers, COMPARE_CONFIG_TOKEN),
          ),
        ],
      },
      {
        path: ':controllerId',
        loadComponent: () => import('./pipeline-controller-info/pipeline-controller-info.component').then(c => c.PipelineControllerInfoComponent)
      },
    ]
  }
];


@NgModule({
  imports: [
    SingleGraphStateModule,
    CommonDeleteDialogModule,
    ExperimentSharedModule,
    SelectQueueModule,
    RouterModule.forChild(routes),
  ],
})
export class PipelinesControllerModule {
}
