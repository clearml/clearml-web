import {InjectionToken, NgModule} from '@angular/core';
import {EffectsModule} from '@ngrx/effects';
import {ReportsEffects} from './reports.effects';
import {ActionReducer, StoreConfig, StoreModule} from '@ngrx/store';
import {REPORTS_KEY, reportsReducer, ReportsState, selectDirtyReport} from './reports.reducer';
import {NgxPrintModule} from 'ngx-print';
import {UserPreferences} from '@common/user-preferences';
import {createUserPrefFeatureReducer} from '@common/core/meta-reducers/user-pref-reducer';
import {REPORTS_PREFIX} from '@common/reports/reports.actions';
import {CommonProjectsModule} from '@common/projects/common-projects.module';
import {RouterModule, Routes} from '@angular/router';
import {CrumbTypeEnum} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {leavingBeforeSaveAlertGuard} from '@common/shared/guards/leaving-before-save-alert.guard';


const reportsSyncedKeys = ['orderBy', 'sortOrder'];
export const REPORTS_STORE_CONFIG_TOKEN =
  new InjectionToken<StoreConfig<ReportsState>>('DatasetsConfigToken');

const getInitState = (userPreferences: UserPreferences) => ({
  metaReducers: [
    (reducer: ActionReducer<ReportsState>) =>
      createUserPrefFeatureReducer(REPORTS_KEY, reportsSyncedKeys, [REPORTS_PREFIX], userPreferences, reducer),
  ]
});

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./reports-page/reports-page.component').then(c => c.ReportsPageComponent),
    data: {search: true, staticBreadcrumb: [[{
        name: 'REPORTS',
        type: CrumbTypeEnum.Feature
      }]]}
  },
  // Adding project param to url, for automatic workspace switching.
  {
    path: ':projectId',
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
@NgModule({
  imports: [
    CommonProjectsModule,
    NgxPrintModule,
    EffectsModule.forFeature([ReportsEffects]),
    StoreModule.forFeature(REPORTS_KEY, reportsReducer, REPORTS_STORE_CONFIG_TOKEN),
    RouterModule.forChild(routes)
  ],
  providers: [
    {provide: REPORTS_STORE_CONFIG_TOKEN, useFactory: getInitState, deps: [UserPreferences]},
  ],
})
export class ReportsModule {
}
