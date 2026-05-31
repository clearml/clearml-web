import {Routes} from '@angular/router';
import {WorkersAndQueuesResolver} from '~/shared/resolvers/workers-and-queues.resolver';
import {CrumbTypeEnum} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {resetContextMenuGuard} from '@common/shared/guards/resetContextMenuGuard.guard';
import {workersAndQueuesProviders} from '@common/workers-and-queues/workers-and-queues.providers';
import {queueCreateDialogProviders} from '@common/shared/queue-create-dialog/queue-create-dialog.providers';
import {selectQueueProviders} from '@common/experiments/shared/components/select-queue/select-queue.providers';

const wQBreadcrumb = [[{
  name: 'WORKERS AND QUEUES',
  type: CrumbTypeEnum.Feature
}]];

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('~/features/workers-and-queues/orchestration.component').then(c => c.OrchestrationComponent),
    canDeactivate: [resetContextMenuGuard],
    providers: [workersAndQueuesProviders],
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
        providers: [
          ...queueCreateDialogProviders,
          ...selectQueueProviders
        ],
        data: {staticBreadcrumb: wQBreadcrumb, queuesManager: true}
      },
    ]
  }
];
