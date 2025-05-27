import {NgModule} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {DashboardSearchEffects as commonDashboardSearchEffects } from '@common/dashboard-search/dashboard-search.effects';
import {DashboardSearchEffects} from '~/features/dashboard-search/dashboard-search.effects';
import {dashboardSearchReducer} from '@common/dashboard-search/dashboard-search.reducer';
import {ModelCardComponent} from '@common/shared/ui-components/panel/model-card/model-card.component';
import {ExperimentCardComponent} from '@common/shared/ui-components/panel/experiment-card/experiment-card.component';
import {CheckPermissionDirective} from '~/shared/directives/check-permission.directive';
import {ProjectCardComponent} from '@common/shared/ui-components/panel/project-card/project-card.component';
import {PipelineCardComponent} from '@common/pipelines/pipeline-card/pipeline-card.component';
import {VirtualGridComponent} from '@common/shared/components/virtual-grid/virtual-grid.component';
import {SearchResultsPageComponent} from '~/features/dashboard-search/containers/search-results-page/search-results-page.component';
import {DashboardSearchComponent} from '~/features/dashboard-search/containers/dashboard-search/dashboard-search.component';
import {DatasetsSharedModule} from '~/features/datasets/shared/datasets-shared.module';
import {ReportCardComponent} from '@common/reports/report-card/report-card.component';
import {DashboardSearchRoutingModule} from '~/features/dashboard-search/dashboard-search-routing.module';
import {MatTab, MatTabGroup} from '@angular/material/tabs';

@NgModule({
  imports: [
    StoreModule.forFeature('search', dashboardSearchReducer),
    EffectsModule.forFeature([DashboardSearchEffects, commonDashboardSearchEffects]),
    DashboardSearchRoutingModule,
    AsyncPipe,
    VirtualGridComponent,
    CheckPermissionDirective,
    ProjectCardComponent,
    ExperimentCardComponent,
    ModelCardComponent,
    PipelineCardComponent,
    DatasetsSharedModule,
    ReportCardComponent,
    MatTabGroup,
    MatTab,
  ],
  exports: [
    DashboardSearchComponent
  ],
  declarations: [
    SearchResultsPageComponent, DashboardSearchComponent
  ]
})
export class DashboardSearchModule {}
