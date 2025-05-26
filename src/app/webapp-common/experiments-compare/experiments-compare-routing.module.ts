import {ExperimentsCompareComponent} from './experiments-compare.component';
import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {ExperimentCompareDetailsComponent} from './containers/experiment-compare-details/experiment-compare-details.component';
import {ExperimentCompareMetricValuesComponent} from './containers/experiment-compare-metric-values/experiment-compare-metric-values.component';
import {ExperimentCompareScalarChartsComponent} from './containers/experiment-compare-metric-charts/experiment-compare-scalar-charts.component';
import {ExperimentComparePlotsComponent} from './containers/experiment-compare-plots/experiment-compare-plots.component';
import {DebugImagesComponent} from '../debug-images/debug-images.component';
import {ExperimentCompareHyperParamsGraphComponent} from './containers/experiment-compare-hyper-params-graph/experiment-compare-hyper-params-graph.component';
import {ExperimentCompareParamsComponent} from './containers/experiment-compare-params/experiment-compare-params.component';
import {ModelCompareDetailsComponent} from '@common/experiments-compare/containers/model-compare-details/model-compare-details.component';
import {compareNavigationGuard} from '@common/experiments-compare/compare-navigation.guard';
import {resetContextMenuGuard} from '@common/shared/guards/resetContextMenuGuard.guard';


export const routes: Routes = [
  {
    path: '',
    component: ExperimentsCompareComponent,
    canDeactivate: [resetContextMenuGuard],
    data: {search: false},
    children: [
      {path: '', redirectTo: 'details', pathMatch: 'full'},
      {path: 'metrics-values', redirectTo: 'scalars/values', pathMatch: 'full', data: {limit: true}},
      {path: 'metrics-charts', redirectTo: 'scalars/graph', pathMatch: 'full'},
      {path: 'details', component: ExperimentCompareDetailsComponent, data: {mode: 'details', limit: true}},
      {path: 'models-details', component: ModelCompareDetailsComponent, data: {mode: 'details', limit: true}},
      {path: 'network', component: ExperimentCompareParamsComponent, data: {mode: 'hyper-params', limit: true}},
      {path: 'hyper-params', component: ExperimentCompareParamsComponent, pathMatch: 'full', canActivate: [compareNavigationGuard]},
      {path: 'hyper-params/values', component: ExperimentCompareParamsComponent, data: {mode: 'hyper-params', limit: true}},
      {path: 'hyper-params/graph', component: ExperimentCompareHyperParamsGraphComponent},
      {path: 'hyper-params/scatter', component: ExperimentCompareHyperParamsGraphComponent, data: {scatter: true}},
      {path: 'scalars', component: ExperimentCompareMetricValuesComponent, canActivate: [compareNavigationGuard]},
      {path: 'scalars/values', component: ExperimentCompareMetricValuesComponent, data: {limit: true}},
      {path: 'scalars/max-values', component: ExperimentCompareMetricValuesComponent, data: {limit: true}},
      {path: 'scalars/min-values', component: ExperimentCompareMetricValuesComponent, data: {limit: true}},
      {path: 'scalars/graph', component: ExperimentCompareScalarChartsComponent},
      {path: 'metrics-plots', component: ExperimentComparePlotsComponent},
      {path: 'debug-images', component: DebugImagesComponent, data: {mergeIterations: true, multiple: true, limit: true}},
    ]
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),

  ],
  exports: [
    RouterModule
  ]
})
export class ExperimentsCompareRoutingModule {
}

