import {Routes} from '@angular/router';
import {CrumbTypeEnum, IBreadcrumbsLink} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {servingProviders} from './serving.providers';

export const routes: Routes = [
  {
    path: '',
    data: {
      staticBreadcrumb: [[{
        name: 'MODEL ENDPOINTS',
        type: CrumbTypeEnum.Feature
      } as IBreadcrumbsLink]]
    },
    providers: [servingProviders],
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
