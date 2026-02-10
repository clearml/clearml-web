import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {FilterMetadata} from 'primeng/api';
import {BaseEntityHeaderComponent} from '@common/shared/entity-page/base-entity-header/base-entity-header.component';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {
  SelectionEvent
} from '@common/experiments/dumb/select-metric-for-custom-col/select-metric-for-custom-col.component';
import {RefreshButtonComponent} from '@common/shared/components/refresh-button/refresh-button.component';
import {CommonSearchComponent} from '@common/common-search/containers/common-search/common-search.component';
import {
  ClearFiltersButtonComponent
} from '@common/shared/components/clear-filters-button/clear-filters-button.component';
import {ButtonToggleComponent} from '@common/shared/ui-components/inputs/button-toggle/button-toggle.component';
import {FormsModule} from '@angular/forms';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'sm-serving-header',
  templateUrl: './serving-header.component.html',
  styleUrls: ['./serving-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RefreshButtonComponent,
    CommonSearchComponent,
    ClearFiltersButtonComponent,
    ButtonToggleComponent,
    MatIconModule,
    FormsModule,
    TooltipDirective,
    MatIconButton
  ]
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
