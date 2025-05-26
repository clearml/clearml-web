import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {WorkersComponent} from '@common/workers-and-queues/containers/workers/workers.component';
import {QueuesComponent} from '@common/workers-and-queues/containers/queues/queues.component';
import {WorkersAndQueuesResolver} from '~/shared/resolvers/workers-and-queues.resolver';
import {CrumbTypeEnum} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {OrchestrationComponent} from '~/features/workers-and-queues/orchestration.component';
import {resetContextMenuGuard} from '@common/shared/guards/resetContextMenuGuard.guard';

const wQBreadcrumb = [[{
  name: 'WORKERS AND QUEUES',
  type: CrumbTypeEnum.Feature
}]];
export const routes: Routes = [
  {
    path: '',
    component: OrchestrationComponent,
    canDeactivate: [resetContextMenuGuard],
    resolve: {
      queuesManager: WorkersAndQueuesResolver
    },
    children: [
      {path: '', redirectTo: 'workers', pathMatch: 'full'},
      {path: 'workers', component: WorkersComponent, data: {staticBreadcrumb: wQBreadcrumb}},
      {
        path: 'queues',
        component: QueuesComponent,
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
