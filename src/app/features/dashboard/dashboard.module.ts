import {NgModule} from '@angular/core';
import {StoreModule} from '@ngrx/store';
import {commonDashboardReducer} from '@common/dashboard/common-dashboard.reducer';
import {EffectsModule} from '@ngrx/effects';
import {ReportsEffects} from '@common/reports/reports.effects';
import {CrumbTypeEnum} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {RouterModule, Routes} from '@angular/router';
import {ProjectDialogModule} from '@common/shared/project-dialog/project-dialog.module';

const staticBreadcrumb = [[{
  name: 'PROJECTS DASHBOARD',
  type: CrumbTypeEnum.Feature
}]];

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('~/features/dashboard/dashboard.component').then(c => c.DashboardComponent),
    data: {staticBreadcrumb}
  },
];


@NgModule({
  imports: [
    RouterModule.forChild(routes),
    StoreModule.forFeature('dashboard', commonDashboardReducer),
    EffectsModule.forFeature([ReportsEffects]),
    ProjectDialogModule
  ],
})
export class DashboardModule {
}
