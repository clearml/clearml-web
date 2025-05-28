import {InjectionToken, NgModule} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {ServingRouterModule} from './serving-routing.module';
import {EffectsModule} from '@ngrx/effects';
import {ActionReducer, StoreConfig, StoreModule} from '@ngrx/store';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ExperimentSharedModule} from '~/features/experiments/shared/experiment-shared.module';
import {AngularSplitModule} from 'angular-split';
import {SmFormBuilderService} from '../core/services/sm-form-builder.service';
import {merge, pick} from 'lodash-es';
import {ExperimentGraphsModule} from '@common/shared/experiment-graphs/experiment-graphs.module';
import {createUserPrefFeatureReducer} from '@common/core/meta-reducers/user-pref-reducer';
import {UserPreferences} from '@common/user-preferences';
import {RouterTabNavBarComponent} from '@common/shared/components/router-tab-nav-bar/router-tab-nav-bar.component';
import {PushPipe} from '@ngrx/component';
import {servingFeature, servingFeatureKey, State} from '@common/serving/serving.reducer';
import {ServingEffects} from '@common/serving/serving.effects';
import {ServingComponent} from '@common/serving/serving.component';
import {ServingHeaderComponent} from '@common/serving/serving-header/serving-header.component';
import {ServingGeneralInfoComponent} from '@common/serving/serving-general-info/serving-general-info.component';
import {ServingInfoComponent} from '@common/serving/serving-info/serving-info.component';
import {ServingTableComponent} from '@common/serving/serving-table/serving-table.component';
import {TableCardComponent} from '@common/shared/ui-components/data/table-card/table-card.component';
import {HyperParamMetricColumnComponent} from '@common/experiments/shared/components/hyper-param-metric-column/hyper-param-metric-column.component';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ColGetterPipe} from '@common/shared/pipes/col-getter.pipe';
import {TagListComponent} from '@common/shared/ui-components/tags/tag-list/tag-list.component';
import {TableFilterSortComponent} from '@common/shared/ui-components/data/table/table-filter-sort/table-filter-sort.component';
import {TableCardFilterComponent} from '@common/shared/ui-components/data/table/table-card-filter-template/table-card-filter.component';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {FilterPipe} from '@common/shared/pipes/filter.pipe';
import {PrimeTemplate} from 'primeng/api';
import {IdBadgeComponent} from '@common/shared/components/id-badge/id-badge.component';
import {DurationPipe} from '@common/shared/pipes/duration.pipe';
import {ButtonToggleComponent} from '@common/shared/ui-components/inputs/button-toggle/button-toggle.component';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';
import {MenuItemComponent} from '@common/shared/ui-components/panel/menu-item/menu-item.component';
import {RefreshButtonComponent} from '@common/shared/components/refresh-button/refresh-button.component';
import {ClearFiltersButtonComponent} from '@common/shared/components/clear-filters-button/clear-filters-button.component';
import {LabeledRowComponent} from '@common/shared/ui-components/data/labeled-row/labeled-row.component';
import {CopyClipboardComponent} from '@common/shared/ui-components/indicators/copy-clipboard/copy-clipboard.component';
import {ServingLoadingComponent} from '@common/serving/serving-loading.component';
import {ServingEmptyStateComponent} from '~/features/serving/empty-state/serving-empty-state.component';
import {IsRowSelectedPipe} from '@common/shared/ui-components/data/table/is-rwo-selected.pipe';
import {FileSizePipe} from '@common/shared/pipes/filesize.pipe';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {CommonSearchComponent} from '@common/common-search/containers/common-search/common-search.component';


export const servingSyncedKeys    = [
  'columnsSortOrder',
  'columnFilters',
  'columnsWidth',
  'hiddenProjectTableCols',
  'colsOrder',
  'hiddenCharts'
];

export const SERVING_CONFIG_TOKEN =
  new InjectionToken<StoreConfig<State>>('EndpointsConfigToken');

const localStorageKey = '_saved_endpoints_state_';

const getInitState = (userPreferences: UserPreferences) => ({
  metaReducers: [
    reducer => {
      let onInit = true;
      return (state, action) => {
        const nextState = reducer(state, action);
        if (onInit) {
          onInit = false;
          const savedState = JSON.parse(localStorage.getItem(localStorageKey));
          return merge({}, nextState, savedState);
        }
        if (action.type.startsWith(servingFeatureKey)) {
          localStorage.setItem(localStorageKey, JSON.stringify(pick(nextState,['tableMode', 'hiddenCharts'])));
        }
        return nextState;
      };
    },
    (reducer: ActionReducer<State>) =>
      createUserPrefFeatureReducer(
        servingFeatureKey, servingSyncedKeys, ['[serving]'],
        userPreferences, reducer
      ),
  ]
});


@NgModule({
  imports: [
    ExperimentSharedModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    ServingRouterModule,
    ExperimentSharedModule,
    AngularSplitModule,
    StoreModule.forFeature(servingFeature.name, servingFeature.reducer, SERVING_CONFIG_TOKEN),
    EffectsModule.forFeature(ServingEffects),
    ExperimentGraphsModule,
    RouterTabNavBarComponent,
    PushPipe,
    TableCardComponent,
    HyperParamMetricColumnComponent,
    ShowTooltipIfEllipsisDirective,
    TooltipDirective,
    ColGetterPipe,
    TagListComponent,
    TableFilterSortComponent,
    TableCardFilterComponent,
    TableComponent,
    TimeAgoPipe,
    FilterPipe,
    PrimeTemplate,
    IdBadgeComponent,
    DurationPipe,
    ButtonToggleComponent,
    MenuComponent,
    MenuItemComponent,
    RefreshButtonComponent,
    ClearFiltersButtonComponent,
    LabeledRowComponent,
    CopyClipboardComponent,
    ServingEmptyStateComponent,
    IsRowSelectedPipe,
    FileSizePipe,
    MatIconButton,
    MatIcon,
    CommonSearchComponent
  ],
  providers: [
    SmFormBuilderService, DatePipe,
    {provide: SERVING_CONFIG_TOKEN, useFactory: getInitState, deps: [UserPreferences]},
  ],
  declarations: [ServingInfoComponent, ServingComponent, ServingLoadingComponent,
    ServingGeneralInfoComponent, ServingHeaderComponent,
    ServingTableComponent
  ]
})
export class ServingModule {
}
