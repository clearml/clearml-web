import {Routes} from '@angular/router';
import {CrumbTypeEnum} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {leavingBeforeSaveAlertGuard} from '@common/shared/guards/leaving-before-save-alert.guard';
import {selectDirtyReport} from './reports.reducer';
import {commonProjectsProviders} from '@common/projects/common-projects.providers';
import {reportsProviders} from './reports.providers';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./reports-page/reports-page.component').then(c => c.ReportsPageComponent),
    data: {search: true, staticBreadcrumb: [[{
        name: 'REPORTS',
        type: CrumbTypeEnum.Feature
      }]]},
    providers: [
      reportsProviders,
      ...commonProjectsProviders
    ]
  },
  // Adding project param to url, for automatic workspace switching.
  {
    path: ':projectId',
    providers: [reportsProviders],
    children: [
      {
        path: 'reports',
        loadComponent: () => import('./reports-page/reports-page.component').then(c => c.ReportsPageComponent),
        data: {search: true}
      },
      {
        path: 'projects',
        loadComponent: () => import('./nested-reports-page/nested-reports-page.component').then(c => c.NestedReportsPageComponent),
        data: {search: true}
      },
      {
        path: ':reportId',
        loadComponent: () => import('./report/report.component').then(c => c.ReportComponent),
        canDeactivate: [leavingBeforeSaveAlertGuard(selectDirtyReport)],
      }
    ]
  },
];
