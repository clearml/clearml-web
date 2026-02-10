import {ChangeDetectionStrategy, Component, computed, input, output, TemplateRef} from '@angular/core';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {FilterMetadata} from 'primeng/api';
import {BaseEntityHeaderComponent} from '@common/shared/entity-page/base-entity-header/base-entity-header.component';
import {SelectionEvent, SelectMetricForCustomColComponent} from '@common/experiments/dumb/select-metric-for-custom-col/select-metric-for-custom-col.component';
import {ButtonToggleComponent} from '@common/shared/ui-components/inputs/button-toggle/button-toggle.component';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {CustomColumnMode} from '@common/experiments/shared/common-experiments.const';
import {PushPipe} from '@ngrx/component';
import {ToggleArchiveComponent} from '@common/shared/ui-components/buttons/toggle-archive/toggle-archive.component';
import {ClearFiltersButtonComponent} from '@common/shared/components/clear-filters-button/clear-filters-button.component';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';
import {MenuItemComponent} from '@common/shared/ui-components/panel/menu-item/menu-item.component';
import {MatFormField} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';
import {FormsModule} from '@angular/forms';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ExperimentCustomColsMenuComponent} from '@common/experiments/dumb/experiment-custom-cols-menu/experiment-custom-cols-menu.component';
import {RefreshButtonComponent} from '@common/shared/components/refresh-button/refresh-button.component';
import {SelectHyperParamsForCustomColComponent} from '@common/experiments/dumb/select-hyper-params-for-custom-col/select-hyper-params-for-custom-col.component';
import {NgTemplateOutlet} from '@angular/common';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {CommonSearchComponent} from '@common/common-search/containers/common-search/common-search.component';
import {SingleGraphStateModule} from '@common/shared/single-graph/single-graph-state.module';

@Component({
    selector: 'sm-experiment-header',
    templateUrl: './experiment-header.component.html',
    styleUrls: ['./experiment-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PushPipe,
    ToggleArchiveComponent,
    ButtonToggleComponent,
    ClearFiltersButtonComponent,
    MenuComponent,
    MenuItemComponent,
    MatFormField,
    MatSelect,
    FormsModule,
    MatOption,
    TooltipDirective,
    ExperimentCustomColsMenuComponent,
    RefreshButtonComponent,
    SelectMetricForCustomColComponent,
    SelectHyperParamsForCustomColComponent,
    NgTemplateOutlet,
    MatIconButton,
    MatIcon,
    SingleGraphStateModule,
    CommonSearchComponent,
  ]
})
export class ExperimentHeaderComponent extends BaseEntityHeaderComponent {

  protected readonly customColumnModeEnum = CustomColumnMode;
  customColumnMode: CustomColumnMode;

  isArchived = input<boolean>();
  metricVariants = input<MetricVariantResult[]>();
  hyperParams = input<any[]>();
  minimizedView = input<boolean>();
  isMetricsLoading = input<boolean>();
  tableFilters = input<Record<string, FilterMetadata>>();
  sharedView = input<boolean>();
  showNavbarLinks = input<boolean>();
  tableMode = input<'table' | 'info' | 'compare'>();
  compareView = input<'scalars' | 'plots'>();
  showCompareScalarSettings = input<boolean>();
  rippleEffect = input<boolean>();
  addButtonTemplate = input<TemplateRef<{ smallScreen: boolean }>>();

  tableCols = input<ISmCol[]>();
  tableColsWithHeader = computed(() => this.tableCols()?.filter(col => col.header !== ''));

  isArchivedChanged = output<boolean>();
  selectedTableColsChanged = output<ISmCol>();
  removeColFromList = output<ISmCol['id']>();
  getMetricsToDisplay = output();
  selectedMetricToShow = output<SelectionEvent>();
  selectedHyperParamToShow = output<{
    param: string;
    addCol: boolean;
  }>();
  setAutoRefresh = output<boolean>();
  toggleShowCompareSettings = output();
  compareViewChanged = output<'scalars' | 'plots'>();
  clearSelection = output();
  clearTableFilters = output<Record<string, FilterMetadata>>();
  tableModeChanged = output<'table' | 'info' | 'compare'>();

  protected toggleButtons = computed(() => [
    {label: 'Table view', value: 'table', icon: 'al-ico-table-view'},
    {label: 'Details view', value: 'info', icon: 'al-ico-experiment-view'},
    ...([EntityTypeEnum.experiment, EntityTypeEnum.controller].includes(this.entityType()) ? [{label: 'Compare view', value: 'compare', icon: 'al-ico-charts-view'}] : [])
  ]);
}
