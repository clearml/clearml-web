import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {leavingBeforeSaveAlertGuard} from '../shared/guards/leaving-before-save-alert.guard';
import {CrumbTypeEnum, IBreadcrumbsLink} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {selectIsModelInEditMode, selectLastVisitedModelsTab} from '@common/models/reducers';
import {lastVisitedSettingTabGuard} from '@common/shared/guards/last-visted-set-tab.guard';
import {setLastModelsTab} from '@common/models/actions/models-info.actions';
import {lastVisitedTabGuard} from '@common/shared/guards/last-visted-tab.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./models.component').then(c => c.ModelsComponent),
    data: {
      staticBreadcrumb: [[{
        name: 'Models',
        type: CrumbTypeEnum.Feature
      } as IBreadcrumbsLink]]
    },
    children: [
      {
        path: ':modelId', canDeactivate: [lastVisitedSettingTabGuard], data: {lastTabAction: setLastModelsTab},
        loadComponent: () => import('./containers/model-info/model-info.component').then(c => c.ModelInfoComponent),
        children: [
          {
            path: '',
            children: [],
            pathMatch: 'full',
            canActivate: [lastVisitedTabGuard],
            data: {minimized: true, lastTabSelector: selectLastVisitedModelsTab}
          },
          {
            path: 'general',
            loadComponent: () => import('./containers/model-info-general/model-info-general.component').then(c => c.ModelInfoGeneralComponent),
            canDeactivate: [leavingBeforeSaveAlertGuard(selectIsModelInEditMode)],
            data: {minimized: true}
          },
          {
            path: 'network',
            loadComponent: () => import('./containers/model-info-network/model-info-network.component').then(c => c.ModelInfoNetworkComponent),
            canDeactivate: [leavingBeforeSaveAlertGuard(selectIsModelInEditMode)],
            data: {minimized: true}
          },
          {
            path: 'labels',
            loadComponent: () => import('./containers/model-info-labels/model-info-labels.component').then(c => c.ModelInfoLabelsComponent),
            canDeactivate: [leavingBeforeSaveAlertGuard(selectIsModelInEditMode)],
            data: {minimized: true}
          },
          {
            path: 'metadata',
            loadComponent: () => import('./containers/model-info-metadata/model-info-metadata.component').then(c => c.ModelInfoMetadataComponent),
            canDeactivate: [leavingBeforeSaveAlertGuard(selectIsModelInEditMode)],
            data: {minimized: true}
          },
          {
            path: 'tasks',
            loadComponent: () => import('./containers/model-info-experiments/model-info-experiments.component').then(c => c.ModelInfoExperimentsComponent),
            canDeactivate: [leavingBeforeSaveAlertGuard(selectIsModelInEditMode)],
            data: {minimized: true}
          },
          {
            path: 'scalars',
            loadComponent: () => import('@common/models/containers/model-info-scalars/model-info-scalars.component').then(c => c.ModelInfoScalarsComponent),
            data: {minimized: true}
          },
          {
            path: 'plots',
            loadComponent: () => import('@common/models/containers/model-info-plots/model-info-plots.component').then(c => c.ModelInfoPlotsComponent),
            data: {minimized: true}
          },
        ]
      },
    ]
  },
  {
    path: ':modelId/output',
    loadComponent: () => import('./containers/model-info/model-info.component').then(c => c.ModelInfoComponent),
    data: {search: false, lastTabAction: setLastModelsTab},
    canDeactivate: [lastVisitedSettingTabGuard],
    children: [
      {
        path: '',
        children: [],
        pathMatch: 'full',
        canActivate: [lastVisitedTabGuard],
        data: {lastTabSelector: selectLastVisitedModelsTab}
      },
      {
        path: 'general',
        loadComponent: () =>
          import('./containers/model-info-general/model-info-general.component').then(c => c.ModelInfoGeneralComponent)
      },
      {
        path: 'network',
        loadComponent: () =>
          import('./containers/model-info-network/model-info-network.component').then(c => c.ModelInfoNetworkComponent),
        canDeactivate: [leavingBeforeSaveAlertGuard(selectIsModelInEditMode)]
      },
      {
        path: 'labels',
        loadComponent: () =>
          import('./containers/model-info-labels/model-info-labels.component').then(c => c.ModelInfoLabelsComponent),
        canDeactivate: [leavingBeforeSaveAlertGuard(selectIsModelInEditMode)]
      },
      {
        path: 'metadata',
        loadComponent: () =>
          import('./containers/model-info-metadata/model-info-metadata.component').then(c => c.ModelInfoMetadataComponent),
        canDeactivate: [leavingBeforeSaveAlertGuard(selectIsModelInEditMode)]
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./containers/model-info-experiments/model-info-experiments.component').then(c => c.ModelInfoExperimentsComponent),
        canDeactivate: [leavingBeforeSaveAlertGuard(selectIsModelInEditMode)]
      },
      {
        path: 'scalars',
        loadComponent: () =>
          import('@common/models/containers/model-info-scalars/model-info-scalars.component').then(c => c.ModelInfoScalarsComponent)
      },
      {
        path: 'plots',
        loadComponent: () =>
          import('@common/models/containers/model-info-plots/model-info-plots.component').then(c => c.ModelInfoPlotsComponent),
      },
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

