import {Routes} from '@angular/router';
import {provideState} from '@ngrx/store';
import {commonDashboardReducer} from '@common/dashboard/common-dashboard.reducer';
import {commonDashboardProviders} from '@common/dashboard/common-dashboard.providers';
import {CrumbTypeEnum} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {provideEffects} from '@ngrx/effects';
import {ReportsEffects} from '@common/reports/reports.effects';
import {projectDialogProviders} from '@common/shared/project-dialog/project-dialog.providers';
import {commonProjectsProviders} from '@common/projects/common-projects.providers';

const staticBreadcrumb = [[{
  name: 'PROJECTS DASHBOARD',
  type: CrumbTypeEnum.Feature
}]];

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('~/features/dashboard/dashboard.component').then(c => c.DashboardComponent),
    data: {staticBreadcrumb},
    providers: [
      provideState('dashboard', commonDashboardReducer),
      provideEffects([ReportsEffects]),
      ...projectDialogProviders,
      ...commonProjectsProviders,
      ...commonDashboardProviders
    ]
  },
];
