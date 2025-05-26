import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {ModelsComponent} from './models.component';
import {ModelInfoComponent} from './containers/model-info/model-info.component';
import {ModelInfoGeneralComponent} from './containers/model-info-general/model-info-general.component';
import {ModelInfoNetworkComponent} from './containers/model-info-network/model-info-network.component';
import {ModelInfoLabelsComponent} from './containers/model-info-labels/model-info-labels.component';
import {leavingBeforeSaveAlertGuard} from '../shared/guards/leaving-before-save-alert.guard';
import {ModelInfoMetadataComponent} from './containers/model-info-metadata/model-info-metadata.component';
import {
  ModelInfoExperimentsComponent
} from '@common/models/containers/model-info-experiments/model-info-experiments.component';
import {ModelInfoScalarsComponent} from '@common/models/containers/model-info-scalars/model-info-scalars.component';
import {ModelInfoPlotsComponent} from '@common/models/containers/model-info-plots/model-info-plots.component';
import {CrumbTypeEnum, IBreadcrumbsLink} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {selectIsModelInEditMode} from '@common/models/reducers';

export const routes: Routes = [
  {
    path: '',
    component: ModelsComponent,
    data: {
      staticBreadcrumb: [[{
        name: 'Models',
        type: CrumbTypeEnum.Feature
      } as IBreadcrumbsLink]]
    },
    children : [
      {
        path: ':modelId', component: ModelInfoComponent,
        children: [
          {path: '', redirectTo: 'general', pathMatch: 'full', data: {minimized: true}},
          {path: 'general',
            component: ModelInfoGeneralComponent,
            canDeactivate: [leavingBeforeSaveAlertGuard(selectIsModelInEditMode)],
            data: {minimized: true}},
          {
            path: 'network',
            component: ModelInfoNetworkComponent,
            canDeactivate: [leavingBeforeSaveAlertGuard(selectIsModelInEditMode)],
            data: {minimized: true}
          },
          {path: 'labels',
            component: ModelInfoLabelsComponent,
            canDeactivate: [leavingBeforeSaveAlertGuard(selectIsModelInEditMode)],
            data: {minimized: true}
          },
          {path: 'metadata',
            component: ModelInfoMetadataComponent,
            canDeactivate: [leavingBeforeSaveAlertGuard(selectIsModelInEditMode)],
            data: {minimized: true}
          },
          {path: 'tasks',
            component: ModelInfoExperimentsComponent,
            canDeactivate: [leavingBeforeSaveAlertGuard(selectIsModelInEditMode)],
            data: {minimized: true}
          },
          {path: 'scalars', component: ModelInfoScalarsComponent, data: {minimized: true}},
          {path: 'plots', component: ModelInfoPlotsComponent, data: {minimized: true}},
        ]
      },
    ]
  },
  {
    path: ':modelId/output',
    component: ModelInfoComponent,
    data: {search: false},
    children: [
      {path: '', redirectTo: 'general', pathMatch: 'full'},
      {path: 'general', component: ModelInfoGeneralComponent},
      {path: 'network', component: ModelInfoNetworkComponent, canDeactivate: [leavingBeforeSaveAlertGuard(selectIsModelInEditMode)]},
      {path: 'labels', component: ModelInfoLabelsComponent, canDeactivate: [leavingBeforeSaveAlertGuard(selectIsModelInEditMode)]},
      {path: 'metadata', component: ModelInfoMetadataComponent, canDeactivate: [leavingBeforeSaveAlertGuard(selectIsModelInEditMode)]},
      {path: 'tasks', component: ModelInfoExperimentsComponent, canDeactivate: [leavingBeforeSaveAlertGuard(selectIsModelInEditMode)]},
      {path: 'scalars', component: ModelInfoScalarsComponent},
      {path: 'plots', component: ModelInfoPlotsComponent},
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class ModelRouterModule {
}

