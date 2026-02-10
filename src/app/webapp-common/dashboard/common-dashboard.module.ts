import {NgModule} from '@angular/core';
import {CommonDashboardEffects} from './common-dashboard.effects';
import {EffectsModule} from '@ngrx/effects';
import {CommonProjectsModule} from '../projects/common-projects.module';
import {ReportsEffects} from '@common/reports/reports.effects';


@NgModule({
  imports: [
    EffectsModule.forFeature([CommonDashboardEffects, ReportsEffects]),
    CommonProjectsModule,
  ]
})
export class CommonDashboardModule {
}
