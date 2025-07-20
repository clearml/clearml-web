import {Routes} from '@angular/router';
import {projectRedirectGuardGuard} from '@common/shared/guards/project-redirect.guard';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {resetContextMenuGuard} from '@common/shared/guards/resetContextMenuGuard.guard';


export const routes: Routes = [
  {path: '', redirectTo: 'dashboard', pathMatch: 'full'},
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
    data: {search: true, userFocus: true},
  },
  {
    path: 'projects',
    data: {search: true},
    loadChildren: () => import('./features/projects/projects.module').then(m => m.ProjectsModule),
  },
  {path: 'login', loadChildren: () => import('./features/login/login.module').then(m => m.LoginModule)},
  {
    path: 'settings',
    loadChildren: () => import('./features/settings/settings.module').then(m => m.SettingsModule),
    data: {search: false, workspaceNeutral: false, },
  },
  {
    path: 'projects',
    data: {search: true},
    children: [
      {path: '', redirectTo: '*', pathMatch: 'full'},
      {
        path: ':projectId',
        data: {search: true},
        children: [
          {path: '', pathMatch: 'full', children: [], canActivate: [projectRedirectGuardGuard]},
          {
            path: 'overview',
            data: {search: false},
            loadChildren: () => import('./webapp-common/project-info/project-info.module').then(m => m.ProjectInfoModule),
            canDeactivate: [resetContextMenuGuard]
          },
          {path: 'projects', loadChildren: () => import('./features/projects/projects.module').then(m => m.ProjectsModule)},
          {path: 'experiments', redirectTo: 'tasks'},
          {
            path: 'tasks',
            data: {autoSearchTab: 'tasks'},
            loadChildren: () => import('./features/experiments/experiments.module').then(m => m.ExperimentsModule),
            canDeactivate: [resetContextMenuGuard]
          },
          {
            path: 'models',
            data: {autoSearchTab: 'models'},
            loadChildren: () => import('./webapp-common/models/models.module').then(m => m.ModelsModule),
            canDeactivate: [resetContextMenuGuard]
          },
          {path: 'compare-experiments', redirectTo: 'compare-tasks'},
          {
            path: 'compare-tasks',
            data: {entityType: EntityTypeEnum.experiment, search: false, autoSearchTab: 'tasks'},
            loadChildren: () =>
              import('./webapp-common/experiments-compare/experiments-compare.module').then(m => m.ExperimentsCompareModule)
          },
          {
            path: 'compare-models',
            data: {entityType: EntityTypeEnum.model, autoSearchTab: 'models' },
            loadChildren: () => import('./webapp-common/experiments-compare/experiments-compare.module').then(m => m.ExperimentsCompareModule)
          },
        ]
      },
    ]
  },
  {
    path: 'pipelines',
    data: {search: true, autoSearchTab: 'pipelines'},
    loadChildren: () => import('@common/pipelines/pipelines.module').then(m => m.PipelinesModule),
  },
  {
    path: 'pipelines',
    data: {search: true, autoSearchTab: 'pipelines'},
    children: [
      {
        path: ':projectId',
        children: [
          {
            path: 'pipelines',
            loadChildren: () =>
              import('@common/pipelines/pipelines.module').then(m => m.PipelinesModule)},
          {
            path: 'projects',
            loadComponent: () =>
              import('@common/pipelines/nested-pipeline-page/nested-pipeline-page.component').then(m => m.NestedPipelinePageComponent)
          },
          {path: 'experiments', redirectTo: 'tasks'},
          {
            path: 'tasks',
            loadChildren: () =>
              import('@common/pipelines-controller/pipelines-controller.module').then(m => m.PipelinesControllerModule)
          },
          {path: 'compare-experiments', redirectTo: 'compare-tasks'},
          {
            path: 'compare-tasks',
            data: {entityType: EntityTypeEnum.controller},
            loadChildren: () =>
              import('./webapp-common/experiments-compare/experiments-compare.module').then(m => m.ExperimentsCompareModule)
          },
        ]
      },
    ]
  },
  {
    path: 'datasets',
    data: {search: true, autoSearchTab: 'datasets'},
    loadChildren: () => import('./features/datasets/datasets.module').then(m => m.DatasetsModule)
  },
  {
    path: 'reports',
    data: {autoSearchTab: 'reports'},
    loadChildren: () => import('./webapp-common/reports/reports.module').then(m => m.ReportsModule)
  },
  {path: 'workers-and-queues', loadChildren: () => import('./features/workers-and-queues/workers-and-queues.module').then(m => m.WorkersAndQueuesModule)},
  {
    path: 'endpoints',
    loadChildren: () => import('./webapp-common/serving/serving.module').then(m => m.ServingModule),
    canDeactivate: [resetContextMenuGuard]
  },
  {
    path: 'enterprise',
    loadChildren: () => import('@common/enterprise-visibility/enterprise.routes').then(r => r.routes),
    canDeactivate: [resetContextMenuGuard],
  },
  {path: '404', loadChildren: () => import('./features/not-found/not-found.module').then(m => m.NotFoundModule)},
  {path: '**', loadChildren: () => import('./features/not-found/not-found.module').then(m => m.NotFoundModule)},

];
