import {Component, computed, input, output } from '@angular/core';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {FilterMetadata} from 'primeng/api';
import {BaseEntityHeaderComponent} from '@common/shared/entity-page/base-entity-header/base-entity-header.component';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {
  SelectionEvent, SelectMetricForCustomColComponent
} from '@common/experiments/dumb/select-metric-for-custom-col/select-metric-for-custom-col.component';
import {CustomColumnMode} from '@common/experiments/shared/common-experiments.const';
import {
  SelectMetadataKeysCustomColsComponent
} from '@common/shared/components/select-metadata-keys-custom-cols/select-metadata-keys-custom-cols.component';
import {ToggleArchiveComponent} from '@common/shared/ui-components/buttons/toggle-archive/toggle-archive.component';
import {ButtonToggleComponent} from '@common/shared/ui-components/inputs/button-toggle/button-toggle.component';
import {MenuItemComponent} from '@common/shared/ui-components/panel/menu-item/menu-item.component';
import {
  ExperimentCustomColsMenuComponent
} from '@common/experiments/dumb/experiment-custom-cols-menu/experiment-custom-cols-menu.component';
import {
  ClearFiltersButtonComponent
} from '@common/shared/components/clear-filters-button/clear-filters-button.component';
import {CommonSearchComponent} from '@common/common-search/containers/common-search/common-search.component';
import {RefreshButtonComponent} from '@common/shared/components/refresh-button/refresh-button.component';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';
import {PushPipe} from '@ngrx/component';
import {FormsModule} from '@angular/forms';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';

@Component({
  selector: 'sm-model-header',
  templateUrl: './model-header.component.html',
  styleUrls: ['./model-header.component.scss'],
  imports: [
    SelectMetricForCustomColComponent,
    SelectMetadataKeysCustomColsComponent,
    ToggleArchiveComponent,
    ButtonToggleComponent,
    MenuItemComponent,
    ExperimentCustomColsMenuComponent,
    ClearFiltersButtonComponent,
    CommonSearchComponent,
    RefreshButtonComponent,
    MenuComponent,
    PushPipe,
    FormsModule,
    TooltipDirective
  ]
})
export class ModelHeaderComponent extends BaseEntityHeaderComponent {

  protected readonly customColumnModeEnum = CustomColumnMode;
  customColumnMode: CustomColumnMode;

  minimizedView = input<boolean>();
  tableFilters = input<Record<string, FilterMetadata>>();
  sharedView = input<boolean>(false);
  isArchived = input<boolean>();
  hideArchiveToggle = input<boolean>();
  disableCreateNewButton = input<boolean>();
  metadataKeys = input<string[]>();
  metricVariants = input<MetricVariantResult[]>();
  tableMode = input<'table' | 'info' | 'compare'>();
  rippleEffect = input<boolean>();
  hideNavigation = input<boolean>();
  tableCols = input<ISmCol[]>();
  tableCols2 = computed(() => this.tableCols()?.filter(col => col.header !== ''));

  isArchivedChanged = output<boolean>();
  addModelClicked = output();
  refreshListClicked = output();
  setAutoRefresh = output<boolean>();
  selectedTableColsChanged = output<ISmCol>();
  selectedMetricToShow = output<SelectionEvent>();
  selectMetadataKeysActiveChanged = output<{customMode: CustomColumnMode}>();
  clearTableFilters = output<Record<string, FilterMetadata>>();
  addOrRemoveMetadataKeyFromColumns = output<{
        key: string;
        show: boolean;
    }>();
  tableModeChanged = output<'table' | 'info' | 'compare'>();
  removeColFromList = output<ISmCol['id']>();

  onIsArchivedChanged(value: boolean) {
    this.isArchivedChanged.emit(value);
  }
}
