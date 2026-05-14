import {Routes} from '@angular/router';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {CrumbTypeEnum} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {commonProjectsProviders} from '@common/projects/common-projects.providers';

export const routes: Routes = [
  {
    path     : '',
    loadComponent: () => import('@common/datasets/open-datasets/open-datasets.component').then(c => c.OpenDatasetsComponent),
    data: {search: true, staticBreadcrumb:[[{
        name: 'DATASETS',
        type: CrumbTypeEnum.Feature
      }]]},
    providers: [
      ...commonProjectsProviders
    ]
  },
  {
    path: 'simple/:projectId',
    data: {search: true},
    providers: [
      ...commonProjectsProviders
    ],
    children: [
      {
        path: 'datasets',
        loadComponent: () => import('@common/datasets/open-datasets/open-datasets.component').then(c => c.OpenDatasetsComponent),
        data: {search: true}
      },
      {
        path: 'projects',
        loadComponent: () => import('@common/datasets/nested-open-datasets-page/nested-open-datasets-page.component').then(c => c.NestedOpenDatasetsPageComponent),
        data: {search: true}
      },
      {path: 'experiments', redirectTo: 'tasks'},
      {
        path: 'tasks',
        loadChildren: () => import('@common/dataset-version/dataset-version.routes')
          .then(r => r.routes)
      },
      {
        path: 'compare-tasks',
        data: {entityType: EntityTypeEnum.dataset},
        loadChildren: () => import('@common/experiments-compare/experiments-compare.routes').then(r => r.routes)
      },
    ]
  },
];
