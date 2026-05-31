import {Routes} from '@angular/router';
import {compareNavigationGuard} from '@common/experiments/compare-navigation.guard';
import {compareViewStateGuard} from '@common/experiments/compare-view-state.guard';
import {
  experimentsCompareProviders,
} from '@common/experiments-compare/experiments-compare.providers';
import {singleGraphProviders} from '@common/shared/single-graph/single-graph.providers';
import {commonDeleteDialogProviders} from '@common/shared/entity-page/entity-delete/common-delete-dialog.providers';
import {selectQueueProviders} from '@common/experiments/shared/components/select-queue/select-queue.providers';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./controllers.component').then(m => m.ControllersComponent),
    providers: [
      ...commonDeleteDialogProviders,
      ...singleGraphProviders,
      ...selectQueueProviders
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
        loadComponent: () =>
          import('@common/experiments-compare/containers/experiment-compare-metric-charts/experiment-compare-scalar-charts.component').then(m => m.ExperimentCompareScalarChartsComponent),
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
        path: ':controllerId',
        loadComponent: () => import('./pipeline-controller-info/pipeline-controller-info.component').then(c => c.PipelineControllerInfoComponent)
      },
    ]
  }
];
