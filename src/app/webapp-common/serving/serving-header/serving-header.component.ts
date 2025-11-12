import {Component, input, output } from '@angular/core';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {FilterMetadata} from 'primeng/api';
import {BaseEntityHeaderComponent} from '@common/shared/entity-page/base-entity-header/base-entity-header.component';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {
  SelectionEvent
} from '@common/experiments/dumb/select-metric-for-custom-col/select-metric-for-custom-col.component';

@Component({
    selector: 'sm-serving-header',
    templateUrl: './serving-header.component.html',
    styleUrls: ['./serving-header.component.scss'],
    standalone: false
})
export class ServingHeaderComponent extends BaseEntityHeaderComponent {

  minimizedView = input<boolean>();
  tableFilters = input<Record<string, FilterMetadata>>();
  sharedView = input<boolean>(false);
  isArchived = input<boolean>();
  hideArchiveToggle = input<boolean>();
  disableCreateNewButton = input<boolean>();
  metadataKeys = input<string[]>();
  metricVariants = input<MetricVariantResult[]>();
  tableMode = input<'table' | 'info'>();
  rippleEffect = input<boolean>();
  hideNavigation = input<boolean>();
  tableCols = input<ISmCol[]>();

  isArchivedChanged = output<boolean>();
  addModelClicked = output();
  refreshListClicked = output();
  setAutoRefresh = output<boolean>();
  selectedTableColsChanged = output();
  selectedMetricToShow = output<SelectionEvent>();
  selectMetadataKeysActiveChanged = output();
  clearTableFilters = output<Record<string, FilterMetadata>>();
  addOrRemoveMetadataKeyFromColumns = output<{
        key: string;
        show: boolean;
    }>();
  tableModeChanged = output<'table' | 'info'>();
  removeColFromList = output<ISmCol['id']>();
}
