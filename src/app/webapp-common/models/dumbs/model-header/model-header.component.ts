import {Component, computed, input, output } from '@angular/core';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {FilterMetadata} from 'primeng/api/filtermetadata';
import {BaseEntityHeaderComponent} from '@common/shared/entity-page/base-entity-header/base-entity-header.component';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {
  SelectionEvent
} from '@common/experiments/dumb/select-metric-for-custom-col/select-metric-for-custom-col.component';
import {CustomColumnMode} from '@common/experiments/shared/common-experiments.const';

@Component({
    selector: 'sm-model-header',
    templateUrl: './model-header.component.html',
    styleUrls: ['./model-header.component.scss'],
    standalone: false
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
