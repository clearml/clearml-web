import {CanActivateFn, Router, Routes} from '@angular/router';
import {projectRedirectGuardGuard} from '@common/shared/guards/project-redirect.guard';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {resetContextMenuGuard} from '@common/shared/guards/resetContextMenuGuard.guard';
import {inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectCurrentUser} from '@common/core/reducers/users-reducer';
import {map} from 'rxjs/operators';
import {AppComponent} from '~/app.component';


const authenticationRequiredGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const store = inject(Store);

  return store.select(selectCurrentUser)
    .pipe(
      map(user => {
        if (!user) {
          return true;
        }
        const redirectUrl = (route.queryParams['redirect'] || '/').replace('/login', '/');
        return router.parseUrl(redirectUrl);
      })
    );
};

export const routes: Routes = [
  {
    path: '', component: AppComponent,
    children: [
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
                data: {search: false, archiveLabel: ''},
                loadComponent: () => import('./webapp-common/project-info/project-info.component').then(c => c.ProjectInfoComponent),
                canDeactivate: [resetContextMenuGuard]
              },
              {
                path: 'workloads',
                loadChildren: () => import('./webapp-common/project-workloads/workloads.routes').then(r => r.routes),
                data: {search: true},
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
        data: {autoSearchTab: 'modelEndpoints'},
        loadChildren: () => import('./webapp-common/serving/serving.module').then(m => m.ServingModule),
        canDeactivate: [resetContextMenuGuard]
      },
      {
        path: 'enterprise',
        loadChildren: () => import('@common/enterprise-visibility/enterprise.routes').then(r => r.routes),
        canDeactivate: [resetContextMenuGuard],
      },
    ]
  },
  {path: 'login', canActivate: [authenticationRequiredGuard],
    loadChildren: () => import('./features/login/login.module').then(m => m.LoginModule)
  },
  {path: '404', loadComponent: () => import('./features/not-found/not-found/not-found.component').then(c => c.NotFoundComponent)},
  {path: '**', loadComponent: () => import('./features/not-found/not-found/not-found.component').then(c => c.NotFoundComponent)},
];
