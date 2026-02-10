import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {WorkersAndQueuesResolver} from '~/shared/resolvers/workers-and-queues.resolver';
import {CrumbTypeEnum} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {resetContextMenuGuard} from '@common/shared/guards/resetContextMenuGuard.guard';

const wQBreadcrumb = [[{
  name: 'WORKERS AND QUEUES',
  type: CrumbTypeEnum.Feature
}]];
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('~/features/workers-and-queues/orchestration.component').then(c => c.OrchestrationComponent),
    canDeactivate: [resetContextMenuGuard],
    resolve: {
      queuesManager: WorkersAndQueuesResolver
    },
    children: [
      {path: '', redirectTo: 'workers', pathMatch: 'full'},
      {
        path: 'workers',
        loadComponent: () => import('@common/workers-and-queues/containers/workers/workers.component').then(c => c.WorkersComponent),
        data: {staticBreadcrumb: wQBreadcrumb}
      },
      {
        path: 'queues',
        loadComponent: () => import('@common/workers-and-queues/containers/queues/queues.component').then(c => c.QueuesComponent),
        data: {staticBreadcrumb: wQBreadcrumb, queuesManager: true}
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
export class WorkersAndQueuesRoutingModule {
}
