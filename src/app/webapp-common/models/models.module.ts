import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {InjectionToken, NgModule} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {ModelSharedModule} from './shared/model-shared.module';
import {ModelRouterModule} from './models-routing.module';
import {ModelInfoComponent} from './containers/model-info/model-info.component';
import {ModelsComponent} from './models.component';
import {EffectsModule} from '@ngrx/effects';
import {ActionReducer, StoreConfig, StoreModule} from '@ngrx/store';
import {ModelsState, reducers} from './reducers';
import {ModelsViewEffects} from './effects/models-view.effects';
import {ModelInfoHeaderComponent} from './dumbs/model-info-header/model-info-header.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ModelsInfoEffects} from './effects/models-info.effects';
import {ModelInfoGeneralComponent} from './containers/model-info-general/model-info-general.component';
import {ModelGeneralInfoComponent} from './dumbs/model-general-info/model-general-info.component';
import {ModelInfoNetworkComponent} from './containers/model-info-network/model-info-network.component';
import {ModelViewNetworkComponent} from './dumbs/model-view-network/model-view-network.component';
import {ModelInfoLabelsComponent} from './containers/model-info-labels/model-info-labels.component';
import {ModelInfoLabelsViewComponent} from './dumbs/model-info-labels-view/model-info-labels-view.component';
import {ExperimentSharedModule} from '~/features/experiments/shared/experiment-shared.module';
import {ModelsMenuEffects} from './effects/models-menu.effects';
import {AngularSplitModule} from 'angular-split';
import {FeatureModelsModule} from '~/features/models/feature-models.module';
import {SmFormBuilderService} from '../core/services/sm-form-builder.service';
import {MODELS_PREFIX_INFO, MODELS_PREFIX_MENU, MODELS_PREFIX_VIEW, MODELS_STORE_KEY} from './models.consts';
import {ModelHeaderComponent} from '~/webapp-common/models/dumbs/model-header/model-header.component';
import {CommonDeleteDialogModule} from '../shared/entity-page/entity-delete/common-delete-dialog.module';
import {ModelInfoMetadataComponent} from './containers/model-info-metadata/model-info-metadata.component';
import {merge, pick} from 'lodash-es';
import {ModelInfoExperimentsComponent} from './containers/model-info-experiments/model-info-experiments.component';
import {
  ModelExperimentsTableComponent
} from '@common/models/containers/model-experiments-table/model-experiments-table.component';
import {ModelInfoPlotsComponent} from './containers/model-info-plots/model-info-plots.component';
import {ModelInfoScalarsComponent} from './containers/model-info-scalars/model-info-scalars.component';
import {ExperimentGraphsModule} from '@common/shared/experiment-graphs/experiment-graphs.module';
import {createUserPrefFeatureReducer} from '@common/core/meta-reducers/user-pref-reducer';
import {UserPreferences} from '@common/user-preferences';
import {ExperimentCompareSharedModule} from '@common/experiments-compare/shared/experiment-compare-shared.module';
import {RouterTabNavBarComponent} from '@common/shared/components/router-tab-nav-bar/router-tab-nav-bar.component';
import {UuidPipe} from '@common/shared/pipes/uuid.pipe';
import {NAPipe} from '@common/shared/pipes/na.pipe';
import {
  InfoHeaderStatusIconLabelComponent
} from '@common/shared/experiment-info-header-status-icon-label/info-header-status-icon-label.component';
import {MenuItemComponent} from '@common/shared/ui-components/panel/menu-item/menu-item.component';
import {CopyClipboardComponent} from '@common/shared/ui-components/indicators/copy-clipboard/copy-clipboard.component';
import {InlineEditComponent} from '@common/shared/ui-components/inputs/inline-edit/inline-edit.component';
import {TagsMenuComponent} from '@common/shared/ui-components/tags/tags-menu/tags-menu.component';
import {EntityFooterComponent} from '@common/shared/entity-page/entity-footer/entity-footer.component';
import {SectionHeaderComponent} from '@common/shared/components/section-header/section-header.component';
import {CustomColumnsListComponent} from '@common/shared/components/custom-columns-list/custom-columns-list.component';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';
import {
  SelectMetadataKeysCustomColsComponent
} from '@common/shared/components/select-metadata-keys-custom-cols/select-metadata-keys-custom-cols.component';
import {
  ClearFiltersButtonComponent
} from '@common/shared/components/clear-filters-button/clear-filters-button.component';
import {ScrollTextareaComponent} from '@common/shared/components/scroll-textarea/scroll-textarea.component';
import {IdBadgeComponent} from '@common/shared/components/id-badge/id-badge.component';
import {TagListComponent} from '@common/shared/ui-components/tags/tag-list/tag-list.component';
import {MatInputModule} from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {MatSidenavModule} from '@angular/material/sidenav';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  UniqueInListSync2ValidatorDirective
} from '@common/shared/ui-components/template-forms-ui/unique-in-list-sync-validator-2.directive';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {LabeledRowComponent} from '@common/shared/ui-components/data/labeled-row/labeled-row.component';
import {ButtonToggleComponent} from '@common/shared/ui-components/inputs/button-toggle/button-toggle.component';
import {SimpleTableComponent} from '@common/shared/ui-components/data/simple-table/simple-table.component';
import {EditableSectionComponent} from '@common/shared/ui-components/panel/editable-section/editable-section.component';
import {ToggleArchiveComponent} from '@common/shared/ui-components/buttons/toggle-archive/toggle-archive.component';
import {
  SelectableGroupedFilterListComponent
} from '@common/shared/ui-components/data/selectable-grouped-filter-list/selectable-grouped-filter-list.component';
import {OverlayComponent} from '@common/shared/ui-components/overlay/overlay/overlay.component';
import {RefreshButtonComponent} from '@common/shared/components/refresh-button/refresh-button.component';
import {TableModule} from 'primeng/table';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {CountLinesPipe} from '@common/shared/pipes/count-lines.pipe';
import {FileSizePipe} from '@common/shared/pipes/filesize.pipe';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {
  SelectMetricForCustomColComponent
} from '@common/experiments/dumb/select-metric-for-custom-col/select-metric-for-custom-col.component';
import {
  ExperimentCustomColsMenuComponent
} from '@common/experiments/dumb/experiment-custom-cols-menu/experiment-custom-cols-menu.component';
import {PushPipe} from '@ngrx/component';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {CommonSearchComponent} from '@common/common-search/containers/common-search/common-search.component';
import {GraphSettingsBarComponent} from '@common/shared/experiment-graphs/graph-settings-bar/graph-settings-bar.component';


export const modelSyncedKeys    = [
  'view.projectColumnsSortOrder',
  'view.projectColumnFilters',
  'view.projectColumnsWidth',
  'view.hiddenProjectTableCols',
  'view.colsOrder',
  'view.metadataCols'
];

export const MODELS_CONFIG_TOKEN =
  new InjectionToken<StoreConfig<ModelsState>>('ModelsConfigToken');

const localStorageKey = '_saved_models_state_';

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
        if (action.type.startsWith(MODELS_PREFIX_VIEW)) {
          localStorage.setItem(localStorageKey, JSON.stringify(pick(nextState,['view.tableMode'])));
        }
        return nextState;
      };
    },
    (reducer: ActionReducer<ModelsState>) =>
      createUserPrefFeatureReducer(
        MODELS_STORE_KEY, modelSyncedKeys, [MODELS_PREFIX_INFO, MODELS_PREFIX_MENU, MODELS_PREFIX_VIEW],
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
    ModelRouterModule,
    ModelSharedModule,
    ExperimentSharedModule,
    CommonDeleteDialogModule,
    AngularSplitModule,
    StoreModule.forFeature(MODELS_STORE_KEY, reducers, MODELS_CONFIG_TOKEN),
    EffectsModule.forFeature([ModelsViewEffects, ModelsInfoEffects, ModelsMenuEffects]),
    FeatureModelsModule,
    ExperimentGraphsModule,
    ExperimentCompareSharedModule,
    RouterTabNavBarComponent,
    UuidPipe,
    NAPipe,
    InfoHeaderStatusIconLabelComponent,
    MenuItemComponent,
    CopyClipboardComponent,
    InlineEditComponent,
    TagsMenuComponent,
    EntityFooterComponent,
    SectionHeaderComponent,
    CustomColumnsListComponent,
    MenuComponent,
    SelectMetadataKeysCustomColsComponent,
    ClearFiltersButtonComponent,
    ScrollTextareaComponent,
    IdBadgeComponent,
    TagListComponent,
    MatInputModule,
    MatMenuModule,
    MatSidenavModule,
    TooltipDirective,
    UniqueInListSync2ValidatorDirective,
    TableComponent,
    LabeledRowComponent,
    ButtonToggleComponent,
    SimpleTableComponent,
    EditableSectionComponent,
    ToggleArchiveComponent,
    SelectableGroupedFilterListComponent,
    OverlayComponent,
    RefreshButtonComponent,
    TableModule,
    ClickStopPropagationDirective,
    CountLinesPipe,
    FileSizePipe,
    MatSlideToggleModule,
    TimeAgoPipe,
    ShowTooltipIfEllipsisDirective,
    CdkVirtualScrollViewport,
    CdkVirtualForOf,
    CdkFixedSizeVirtualScroll,
    SelectMetricForCustomColComponent,
    ExperimentCustomColsMenuComponent,
    ModelInfoMetadataComponent,
    PushPipe,
    MatIconButton,
    MatButton,
    MatIcon,
    CommonSearchComponent,
    GraphSettingsBarComponent
  ],
  providers: [
    SmFormBuilderService, DatePipe,
    {provide: MODELS_CONFIG_TOKEN, useFactory: getInitState, deps: [UserPreferences]},
  ],

  declarations: [ModelInfoComponent, ModelsComponent, ModelInfoHeaderComponent,
    ModelViewNetworkComponent, ModelInfoNetworkComponent,
    ModelInfoLabelsComponent, ModelInfoLabelsViewComponent, ModelInfoGeneralComponent,
    ModelGeneralInfoComponent, ModelHeaderComponent,
    ModelInfoExperimentsComponent,
    ModelExperimentsTableComponent,
    ModelInfoPlotsComponent,
    ModelInfoScalarsComponent
  ]
})
export class ModelsModule {
}
