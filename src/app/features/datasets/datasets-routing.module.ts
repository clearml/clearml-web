import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {CrumbTypeEnum} from '@common/layout/breadcrumbs/breadcrumbs.component';

const routes: Routes = [
  {
    path     : '',
    loadComponent: () => import('@common/datasets/open-datasets/open-datasets.component').then(c => c.OpenDatasetsComponent),
    data: {search: true, staticBreadcrumb:[[{
        name: 'DATASETS',
        type: CrumbTypeEnum.Feature
      }]]}
  },
  {
    path: 'simple/:projectId',
    data: {search: true},
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
        loadChildren: () => import('@common/dataset-version/dataset-version.module')
          .then(m => m.DatasetVersionModule)
      },
      {
        path: 'compare-tasks',
        data: {entityType: EntityTypeEnum.dataset},
        loadChildren: () => import('@common/experiments-compare/experiments-compare.module').then(m => m.ExperimentsCompareModule)
      },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DatasetsRoutingModule {}
