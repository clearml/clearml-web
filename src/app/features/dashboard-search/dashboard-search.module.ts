import {NgModule} from '@angular/core';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {DashboardSearchEffects as commonDashboardSearchEffects} from '@common/dashboard-search/dashboard-search.effects';
import {DashboardSearchEffects} from '~/features/dashboard-search/dashboard-search.effects';
import {dashboardSearchReducer} from '@common/dashboard-search/dashboard-search.reducer';

@NgModule({
  imports: [
    StoreModule.forFeature('search', dashboardSearchReducer),
    EffectsModule.forFeature([DashboardSearchEffects, commonDashboardSearchEffects]),
  ],
})
export class DashboardSearchModule {
}
