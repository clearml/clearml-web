import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {CrumbTypeEnum, IBreadcrumbsLink} from '@common/layout/breadcrumbs/breadcrumbs.component';

export const routes: Routes = [
  {
    path: '',
    data: {
      staticBreadcrumb: [[{
        name: 'MODEL ENDPOINTS',
        type: CrumbTypeEnum.Feature
      } as IBreadcrumbsLink]]
    },
    children: [
      {
        path: 'active',
        loadComponent: () => import('@common/serving/serving.component').then(c => c.ServingComponent),
        children: [
          {
            path: ':endpointId',
            loadComponent: () => import('@common/serving/serving-info/serving-info.component').then(c => c.ServingInfoComponent),
            children: [
              {path: '', redirectTo: 'general', pathMatch: 'full', data: {minimized: true}},
              {
                path: 'general',
                loadComponent: () => import('@common/serving/serving-general-info/serving-general-info.component').then(c => c.ServingGeneralInfoComponent),
                data: {
                  minimized: true,
                  staticBreadcrumb: [[{
                    name: 'MODEL ENDPOINTS',
                    type: CrumbTypeEnum.Feature
                  } as IBreadcrumbsLink]]
                }
              },
              {
                path: 'monitor',
                loadComponent: () => import('@common/serving/serving-monitor/serving-monitor.component').then(c => c.ServingMonitorComponent),
                data: {
                  minimized: true,
                  staticBreadcrumb: [[{
                    name: 'MODEL ENDPOINTS',
                    type: CrumbTypeEnum.Feature
                  } as IBreadcrumbsLink]]
                }
              }
            ]
          }
        ]
      },
      {
        path: 'loading',
        loadComponent: () => import('./serving-loading.component').then(c => c.ServingLoadingComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class ServingRouterModule {
}

