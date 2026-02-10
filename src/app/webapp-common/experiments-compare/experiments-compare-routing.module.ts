import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {compareNavigationGuard} from '@common/experiments-compare/compare-navigation.guard';
import {resetContextMenuGuard} from '@common/shared/guards/resetContextMenuGuard.guard';


export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./experiments-compare.component').then(c => c.ExperimentsCompareComponent),
    canDeactivate: [resetContextMenuGuard],
    data: {search: false},
    children: [
      {path: '', redirectTo: 'details', pathMatch: 'full'},
      {path: 'metrics-values', redirectTo: 'scalars/values', pathMatch: 'full', data: {limit: true}},
      {path: 'metrics-charts', redirectTo: 'scalars/graph', pathMatch: 'full'},
      {
        path: 'details', data: {mode: 'details', limit: true},
        loadComponent: () =>
          import('./containers/experiment-compare-details/experiment-compare-details.component').then(c => c.ExperimentCompareDetailsComponent),
      },
      {
        path: 'models-details', data: {mode: 'details', limit: true},
        loadComponent: () => import('@common/experiments-compare/containers/model-compare-details/model-compare-details.component').then(c => c.ModelCompareDetailsComponent),
      },
      {
        path: 'network', data: {mode: 'hyper-params', limit: true},
        loadComponent: () =>
          import('./containers/experiment-compare-params/experiment-compare-params.component').then(c => c.ExperimentCompareParamsComponent),
      },
      {
        path: 'hyper-params', pathMatch: 'full', canActivate: [compareNavigationGuard],
        loadComponent: () =>
          import('./containers/experiment-compare-params/experiment-compare-params.component').then(c => c.ExperimentCompareParamsComponent),
      },
      {
        path: 'hyper-params/values', data: {mode: 'hyper-params', limit: true},
        loadComponent: () =>
          import('./containers/experiment-compare-params/experiment-compare-params.component').then(c => c.ExperimentCompareParamsComponent),
      },
      {
        path: 'hyper-params/graph',
        loadComponent: () =>
          import('./containers/experiment-compare-hyper-params-graph/experiment-compare-hyper-params-graph.component').then(c => c.ExperimentCompareHyperParamsGraphComponent),
      },
      {
        path: 'hyper-params/scatter', data: {scatter: true},
        loadComponent: () =>
          import('./containers/experiment-compare-hyper-params-graph/experiment-compare-hyper-params-graph.component').then(c => c.ExperimentCompareHyperParamsGraphComponent),
      },
      {
        path: 'scalars', canActivate: [compareNavigationGuard],
        loadComponent: () =>
          import('./containers/experiment-compare-metric-values/experiment-compare-metric-values.component').then(c => c.ExperimentCompareMetricValuesComponent),
      },
      {
        path: 'scalars/values', data: {limit: true},
        loadComponent: () =>
          import('./containers/experiment-compare-metric-values/experiment-compare-metric-values.component').then(c => c.ExperimentCompareMetricValuesComponent),
      },
      {
        path: 'scalars/max-values', data: {limit: true},
        loadComponent: () =>
          import('./containers/experiment-compare-metric-values/experiment-compare-metric-values.component').then(c => c.ExperimentCompareMetricValuesComponent),
      },
      {
        path: 'scalars/min-values', data: {limit: true}, loadComponent: () =>
          import('./containers/experiment-compare-metric-values/experiment-compare-metric-values.component').then(c => c.ExperimentCompareMetricValuesComponent),
      },
      {
        path: 'scalars/graph', loadComponent: () =>
          import('./containers/experiment-compare-metric-charts/experiment-compare-scalar-charts.component').then(c => c.ExperimentCompareScalarChartsComponent),
      },
      {
        path: 'metrics-plots',
        loadComponent: () => import('./containers/experiment-compare-plots/experiment-compare-plots.component').then(c => c.ExperimentComparePlotsComponent),
      },
      {
        path: 'debug-images',
        loadComponent: () => import('../debug-images/debug-images.component').then(m => m.DebugImagesComponent),
        data: {mergeIterations: true, multiple: true, limit: true}
      },
    ]
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),

  ],
})
export class ExperimentsCompareRoutingModule {
}

