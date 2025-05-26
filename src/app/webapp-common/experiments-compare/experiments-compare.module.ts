import {InjectionToken, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ExperimentsCompareComponent} from './experiments-compare.component';
import {ExperimentsCompareRoutingModule} from './experiments-compare-routing.module';
import {ActionReducer, StoreConfig, StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {experimentsCompareReducers} from './reducers';
import {ExperimentsCompareDetailsEffects} from './effects/experiments-compare-details.effects';
import {ExperimentsCompareChartsEffects} from './effects/experiments-compare-charts.effects';
import {ExperimentsCompareMetricsValuesEffects} from './effects/experiments-compare-metrics-values.effects';
import {
  ExperimentCompareDetailsComponent
} from './containers/experiment-compare-details/experiment-compare-details.component';
import {
  ExperimentCompareMetricValuesComponent
} from './containers/experiment-compare-metric-values/experiment-compare-metric-values.component';
import {ExperimentCompareHeaderComponent} from './dumbs/experiment-compare-header/experiment-compare-header.component';
import {ExperimentSharedModule} from '~/features/experiments/shared/experiment-shared.module';
import {ExperimentGraphsModule} from '../shared/experiment-graphs/experiment-graphs.module';

import {DebugImagesModule} from '../debug-images/debug-images.module';
import {ExperimentCompareSharedModule} from './shared/experiment-compare-shared.module';
import {GetKeyValueArrayPipePipe} from './get-key-value-array-pipe.pipe';
import {SelectCompareHeaderEffects} from './effects/select-experiment-for-compare-effects.service';
import {
  SelectExperimentsForCompareComponent
} from './containers/select-experiments-for-compare/select-experiments-for-compare.component';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {CompareCardListComponent} from './dumbs/compare-card-list/compare-card-list.component';
import {CompareCardBodyDirective} from './dumbs/compare-card-body.directive';
import {CompareCardExtraHeaderDirective} from './dumbs/compare-card-extra-header.directive';
import {CompareCardHeaderDirective} from './dumbs/compare-card-header.directive';
import {CardModule} from '../shared/ui-components/panel/card2';
import {
  ParallelCoordinatesGraphComponent
} from './dumbs/parallel-coordinates-graph/parallel-coordinates-graph.component';
import {
  ExperimentCompareHyperParamsGraphComponent
} from './containers/experiment-compare-hyper-params-graph/experiment-compare-hyper-params-graph.component';
import {ExperimentsCompareScalarsGraphEffects} from './effects/experiments-compare-scalars-graph.effects';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {MatRadioModule} from '@angular/material/radio';
import {
  ExperimentCompareParamsComponent
} from './containers/experiment-compare-params/experiment-compare-params.component';
import {ExperimentsCompareParamsEffects} from './effects/experiments-compare-params.effects';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {
  ModelCompareDetailsComponent
} from '@common/experiments-compare/containers/model-compare-details/model-compare-details.component';
import {IExperimentCompareChartsState} from '@common/experiments-compare/reducers/experiments-compare-charts.reducer';
import {UserPreferences} from '@common/user-preferences';
import {merge, pick} from 'lodash-es';
import {createUserPrefFeatureReducer} from '@common/core/meta-reducers/user-pref-reducer';
import {
  EXPERIMENTS_COMPARE_METRICS_CHARTS_
} from '@common/experiments-compare/actions/experiments-compare-charts.actions';
import {EXPERIMENTS_COMPARE_SELECT_EXPERIMENT_} from '@common/experiments-compare/actions/compare-header.actions';
import {EllipsisMiddleDirective} from '@common/shared/ui-components/directives/ellipsis-middle.directive';
import {CompareScatterPlotComponent} from './containers/compare-scatter-plot/compare-scatter-plot.component';
import {ScatterPlotComponent} from '@common/shared/components/charts/scatter-plot/scatter-plot.component';
import {NoUnderscorePipe} from '@common/shared/pipes/no-underscore.pipe';
import {HideHashPipe} from '@common/shared/pipes/hide-hash.pipe';
import {HideHashTitlePipe} from '@common/shared/pipes/hide-hash-title.pipe';
import {IdToObjectsArrayPipe} from '@common/shared/pipes/idToObjectsArray.pipe';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {
  ExperimentCompareGeneralDataComponent
} from '@common/experiments-compare/dumbs/experiment-compare-general-data/experiment-compare-general-data.component';
import {
  ClearFiltersButtonComponent
} from '@common/shared/components/clear-filters-button/clear-filters-button.component';
import {SearchComponent} from '@common/shared/ui-components/inputs/search/search.component';
import {TableModule} from 'primeng/table';
import {TagListComponent} from '@common/shared/ui-components/tags/tag-list/tag-list.component';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {ChooseColorModule} from '@common/shared/ui-components/directives/choose-color/choose-color.module';
import {PortalComponent} from '@common/shared/portal/portal.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  GroupedCheckedFilterListComponent
} from '@common/shared/ui-components/data/grouped-checked-filter-list/grouped-checked-filter-list.component';
import {
  SelectableGroupedFilterListComponent
} from '@common/shared/ui-components/data/selectable-grouped-filter-list/selectable-grouped-filter-list.component';
import {RefreshButtonComponent} from '@common/shared/components/refresh-button/refresh-button.component';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatOptionModule} from '@angular/material/core';
import {MatSelectModule} from '@angular/material/select';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatInputModule} from '@angular/material/input';
import {
  MetricVariantSelectorComponent
} from '@common/experiments-compare/dumbs/metric-param-selector/metric-variant-selector.component';
import {ParamSelectorComponent} from '@common/experiments-compare/dumbs/param-selector/param-selector.component';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {MetricVariantToPathPipe} from '@common/shared/pipes/metric-variant-to-path.pipe';
import {MetricResultToSelectedMetricPipe} from '@common/shared/pipes/metric-result-to-selected-metric.pipe';
import {MetricVariantToNamePipe} from '@common/shared/pipes/metric-variant-to-name.pipe';
import {DrawerComponent} from '@common/shared/ui-components/panel/drawer/drawer.component';
import {PushPipe} from '@ngrx/component';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {SelectModelModule} from '@common/select-model/select-model.module';


export const COMPARE_STORE_KEY = 'experimentsCompare';
export const COMPARE_CONFIG_TOKEN =
  new InjectionToken<StoreConfig<IExperimentCompareChartsState>>('CompareConfigToken');

export const compareSyncedKeys = [
];

const localStorageKey = '_saved_compare_state_';

export const getCompareConfig = (userPreferences: UserPreferences) => ({
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
        if (action.type.startsWith('EXPERIMENTS_COMPARE_')) {
          localStorage.setItem(localStorageKey, JSON.stringify(pick(nextState, ['charts.settingsList', 'charts.scalarsHoverMode', 'compareHeader.hideIdenticalRows'])));
        }
        return nextState;
      };
    },
    (reducer: ActionReducer<any>) =>
      createUserPrefFeatureReducer(COMPARE_STORE_KEY, compareSyncedKeys, [EXPERIMENTS_COMPARE_METRICS_CHARTS_, EXPERIMENTS_COMPARE_SELECT_EXPERIMENT_], userPreferences, reducer),
  ]
});

@NgModule({
  declarations: [
    ExperimentsCompareComponent,
    ExperimentCompareDetailsComponent,
    ModelCompareDetailsComponent,
    ExperimentCompareParamsComponent,
    ExperimentCompareMetricValuesComponent,
    ExperimentCompareHeaderComponent,
    GetKeyValueArrayPipePipe,
    SelectExperimentsForCompareComponent,
    CompareCardListComponent,
    CompareCardBodyDirective,
    CompareCardExtraHeaderDirective,
    CompareCardHeaderDirective,
    ExperimentCompareHyperParamsGraphComponent,
    CompareScatterPlotComponent
  ],
    exports: [
        GetKeyValueArrayPipePipe,
    ],
  imports: [
    CommonModule,
    DragDropModule,
    DebugImagesModule,
    ScrollingModule,
    CardModule,
    ExperimentSharedModule,
    ExperimentsCompareRoutingModule,
    ExperimentGraphsModule,
    ExperimentCompareSharedModule,
    StoreModule.forFeature(COMPARE_STORE_KEY, experimentsCompareReducers, COMPARE_CONFIG_TOKEN),
    EffectsModule.forFeature([
      ExperimentsCompareDetailsEffects,
      ExperimentsCompareParamsEffects,
      ExperimentsCompareChartsEffects,
      ExperimentsCompareMetricsValuesEffects,
      SelectCompareHeaderEffects,
      ExperimentsCompareScalarsGraphEffects
    ]),
    SelectModelModule,
    MatRadioModule,
    FormsModule,
    ParallelCoordinatesGraphComponent,
    ReactiveFormsModule,
    EllipsisMiddleDirective,
    ScatterPlotComponent,
    NoUnderscorePipe,
    HideHashPipe,
    HideHashTitlePipe,
    IdToObjectsArrayPipe,
    ClickStopPropagationDirective,
    ExperimentCompareGeneralDataComponent,
    ClearFiltersButtonComponent,
    SearchComponent,
    TableModule,
    TagListComponent,
    DialogTemplateComponent,
    ChooseColorModule,
    PortalComponent,
    TooltipDirective,
    GroupedCheckedFilterListComponent,
    SelectableGroupedFilterListComponent,
    RefreshButtonComponent,
    MatSlideToggleModule,
    MatOptionModule,
    MatSelectModule,
    MatSidenavModule,
    MatExpansionModule,
    MatInputModule,
    MetricVariantSelectorComponent,
    ParamSelectorComponent,
    MatInputModule,
    ShowTooltipIfEllipsisDirective,
    MetricVariantToPathPipe,
    MetricResultToSelectedMetricPipe,
    MetricVariantToNamePipe,
    DrawerComponent,
    PushPipe,
    MatButton,
    MatIcon,
    MatIconButton,
  ],
  providers: [
    {provide: COMPARE_CONFIG_TOKEN, useFactory: getCompareConfig, deps: [UserPreferences]},
  ],
})
export class ExperimentsCompareModule {
}

