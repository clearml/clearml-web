import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnChanges, Output, ViewChild} from '@angular/core';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {ICONS, TIME_FORMAT_STRING} from '@common/constants';
import {IOption} from '@common/shared/ui-components/inputs/select-autocomplete-for-template-forms/select-autocomplete-for-template-forms.component';
import {Observable} from 'rxjs';
import {FilterMetadata} from 'primeng/api/filtermetadata';
import {get, parseInt} from 'lodash-es';
import {getRoundedNumber} from '@common/experiments/shared/common-experiments.utils';
import {ColHeaderTypeEnum, ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {createFiltersFromStore} from '@common/shared/utils/tableParamEncode';
import {Store} from '@ngrx/store';
import {selectCompanyTags, selectProjectTags, selectTagsFilterByProject} from '@common/core/reducers/projects.reducer';
import {animate, style, transition, trigger} from '@angular/animations';
import {BaseTableView} from '@common/shared/ui-components/data/table/base-table-view';
import {ServingActions, servingLoadingTableColFields, servingTableColFields} from '@common/serving/serving.actions';
import {servingTableCols} from '@common/serving/serving.consts';
import {EndpointStats} from '~/business-logic/model/serving/endpointStats';
import { EntityTypeEnum } from '~/shared/constants/non-common-consts';
import {fileSizeConfigCount, fileSizeConfigStorage} from '@common/shared/pipes/filesize.pipe';

@Component({
    selector: 'sm-serving-table',
    templateUrl: './serving-table.component.html',
    styleUrl: './serving-table.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('inOutAnimation', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('0.25s ease-in', style({ opacity: 1 }))
            ]),
            transition(':leave', [
                style({ opacity: 1 }),
                animate('0.2s ease-in', style({ opacity: 0 }))
            ])
        ])
    ],
    standalone: false
})
export class ServingTableComponent extends BaseTableView implements OnChanges {
  readonly endpointsTableColFields = servingTableColFields;
  readonly endpointsLoadingTableColFields = servingLoadingTableColFields;
  protected readonly EntityTypeEnum = EntityTypeEnum;
  protected readonly fileSizeConfigCount = fileSizeConfigCount;
  protected readonly fileSizeConfigStorage = fileSizeConfigStorage;
  readonly timeFormatString = TIME_FORMAT_STRING;

  public override filtersOptions: Record<string, IOption[]> = {
    [servingTableColFields.modelName]: [],
    [servingLoadingTableColFields.preprocessArtifact]: [],
  };

  readonly icons = ICONS;
  public menuOpen: boolean;
  public sortOrder = 1;

  public contextEndpoint: EndpointStats;
  public tagsFilterByProject$: Observable<boolean>;
  public projectTags$: Observable<string[]>;
  public companyTags$: Observable<string[]>;
  private _selectedEndpoints: EndpointStats[];
  private _endpoints: EndpointStats[];
  public filtersMatch: Record<string, string> = {};
  public singleRowContext: boolean;
  private _tableFilters: Record<string, FilterMetadata>;
  public roundedMetricValues: Record<string, Record<string, boolean>> = {};
  private allEndpoints: EndpointStats[];


  @Input() set endpoints(endpoints: EndpointStats[]) {
    this._endpoints = endpoints;

    if (!this.allEndpoints && endpoints?.length > 0) {
      this.allEndpoints = [...endpoints];
    }

    this.tableCols?.filter(tableCol => tableCol.id.startsWith('last_metrics')).forEach(col => this._endpoints?.forEach(exp => {
      const value = get(exp, col.id);
      this.roundedMetricValues[col.id] = this.roundedMetricValues[col.id] || {};
      this.roundedMetricValues[col.id][exp.id] = value && getRoundedNumber(value) !== value;
    }));

    if (this.contextEndpoint) {
      this.contextEndpoint = this.endpoints.find(endpoint => endpoint.id === this.contextEndpoint.id);
    }
  }

  get endpoints() {
    return this._endpoints;
  }

  // @Input() noMoreEndpoints: boolean;
  @Input() reorderableColumns = true;
  @Input() tableCols: ISmCol[];
  @Input() enableMultiSelect: boolean;

  @Input() set modelNames(modelNames: string[]) {
    if (!modelNames) {
      this.filtersOptions[servingTableColFields.modelName] = null;
      return;
    }
    this.filtersOptions[servingTableColFields.modelName] = modelNames.map(modelName => ({
      label: modelName,
      value: modelName
    }));
    this.sortOptionsList(servingTableColFields.modelName);
  }
  @Input() set inputTypes(inputTypes: string[]) {
    if (!inputTypes) {
      this.filtersOptions[servingLoadingTableColFields.inputType] = null;
      return;
    }
    this.filtersOptions[servingLoadingTableColFields.inputType] = inputTypes.map(inputType => ({
      label: inputType,
      value: inputType
    }));
    this.sortOptionsList(servingLoadingTableColFields.inputType);
  }
  @Input() set preprocessArtifact(preprocessArtifacts: string[]) {
    if (!preprocessArtifacts) {
      this.filtersOptions[servingLoadingTableColFields.preprocessArtifact] = null;
      return;
    }
    this.filtersOptions[servingLoadingTableColFields.preprocessArtifact] = preprocessArtifacts.map(preprocessArtifact => ({
      label: preprocessArtifact,
      value: preprocessArtifact
    }));
    this.sortOptionsList(servingLoadingTableColFields.preprocessArtifact);
  }

  @Input() set selectedEndpoints(selection) {
    this._selectedEndpoints = selection;
    this.updateSelectionState();
  }

  get selectedEndpoints() {
    return this._selectedEndpoints;
  }

  @Input() set colRatio(ratio: number) {
    if (ratio) {
      this.tableCols.forEach(col => {
        if (col.headerType != ColHeaderTypeEnum.checkBox && col.style?.width?.endsWith('px')) {
          const width = parseInt(col.style.width, 10);
          col.style.width = ratio * width + 'px';
        }
      });
    }
  }

  private _selectedEndpoint;
  @Input() set selectedEndpoint(endpoint) {
    if (endpoint && endpoint.id !== this._selectedEndpoint?.id) {
      window.setTimeout(() => this.table?.focusSelected());
    }
    this._selectedEndpoint = endpoint;
  }

  get selectedEndpoint(): EndpointStats {
    return this._selectedEndpoint;
  }

  @Input() set tableFilters(filters: Record<string, FilterMetadata>) {
    this._tableFilters = filters;
    this.filtersValues = {};
    this.filtersValues[servingTableColFields.modelName] = filters?.[servingTableColFields.modelName] ?? null;
    this.filtersValues[servingTableColFields.endpointURL] = filters?.[servingTableColFields.endpointURL] ?? null;
    this.filtersValues[servingTableColFields.totalRequests] = filters?.[servingTableColFields.totalRequests] ?? null;
    this.filtersValues[servingTableColFields.uptime] = filters?.[servingTableColFields.uptime] ?? null;
    this.filtersValues[servingTableColFields.rpm] = filters?.[servingTableColFields.rpm] ?? null;
    this.filtersValues[servingTableColFields.latency] = filters?.[servingTableColFields.latency] ?? null;
    this.filtersValues[servingTableColFields.instances] = filters?.[servingTableColFields.instances] ?? null;
    this.filtersValues[servingLoadingTableColFields.inputType] = filters?.[servingLoadingTableColFields.inputType] ?? null;
    this.filtersValues[servingLoadingTableColFields.preprocessArtifact] = filters?.[servingLoadingTableColFields.preprocessArtifact] ?? null;
    // this.filtersValues[servingTableColFields.tags] = filters?.[servingTableColFields.tags] ?? null;
    // dynamic filters
    const filtersValues = createFiltersFromStore(filters || {}, false);
    this.filtersValues = Object.assign({}, {...this.filtersValues}, {...filtersValues});
  }

  get tableFilters() {
    return this._tableFilters;
  }

  // @Input() set users(users: User[]) {
  //   this.filtersOptions[servingTableColFields.USER] = users.map(user => ({
  //     label: user.name ? user.name : 'Unknown User',
  //     value: user.id
  //   }));
  //   this.sortOptionsList(servingTableColFields.USER);
  // }

  @Input() set metadataValuesOptions(metadataValuesOptions: Record<ISmCol['id'], string[]>) {
    Object.entries(metadataValuesOptions).forEach(([id, values]) => {
      this.filtersOptions[id] = values === null ? null : [{
        label: '(No Value)',
        value: null
      }].concat(values.map(value => ({
        label: value,
        value
      })));
    });
  }

  // @Input() set tags(tags) {
  //   const tagsAndActiveFilter = Array.from(new Set(tags.concat(this.filtersValues[servingTableColFields.tags])));
  //   this.filtersOptions[servingTableColFields.tags] = tagsAndActiveFilter.map(tag => ({
  //     label: tag === null ? '(No tags)' : tag,
  //     value: tag
  //   }) as IOption);
  //   this.sortOptionsList(servingTableColFields.tags);
  // }

  @Input() systemTags = [] as string[];

  @Output() endpointsSelectionChanged = new EventEmitter<EndpointStats[]>();
  @Output() endpointSelectionChanged = new EventEmitter<{ endpoint: EndpointStats; openInfo?: boolean }>();
  @Output() loadMoreEndpoints = new EventEmitter();
  @Output() tagsMenuOpened = new EventEmitter();
  @Output() sortedChanged = new EventEmitter<{ isShift: boolean; colId: ISmCol['id'] }>();
  @Output() columnResized = new EventEmitter<{ columnId: string; widthPx: number }>();
  @Output() clearAllFilters = new EventEmitter<Record<string, FilterMetadata>>();

  @ViewChild(TableComponent, {static: true}) override table: TableComponent<EndpointStats>;
  public readonly initialColumns = servingTableCols;

  @HostListener('document:click', ['$event'])
  clickHandler(event) {
    if (event.button != 2) { // Bug in firefox: right click triggers `click` event
      this.menuOpen = false;
    }
  }

  constructor(private changeDetector: ChangeDetectorRef, private store: Store) {
    super();
    this.tagsFilterByProject$ = this.store.select(selectTagsFilterByProject);
    this.projectTags$ = this.store.select(selectProjectTags);
    this.companyTags$ = this.store.select(selectCompanyTags);
    this.entitiesKey = 'endpoints';
    this.selectedEntitiesKey = 'ServingEndpoints';

  }

  ngOnChanges() {
    if (this.tableCols?.length > 0) {
      this.tableCols[0].hidden = this.enableMultiSelect === false;
      const statusColumn = this.tableCols.find(col => col.id === 'ready');
      if (statusColumn) {
        statusColumn.filterable = this.enableMultiSelect;
        statusColumn.sortable = this.enableMultiSelect;
      }
    }
  }


  onRowSelectionChanged(event) {
    this.endpointSelectionChanged.emit({endpoint: event.data});
  }


  onLoadMoreClicked() {
    this.loadMoreEndpoints.emit();
  }

  onSortChanged(isShift: boolean, colId: ISmCol['id']) {
    this.sortedChanged.emit({isShift, colId});
    this.scrollTableToTop();
  }

  get sortableCols() {
    return this.tableCols?.filter(col => col.sortable);
  }

  getColName(colId: ISmCol['id']) {
    return this.tableCols?.find(col => colId === col.id)?.header;
  }

  rowSelectedChanged(change: { field: string; value: boolean; event: Event }, endpoint: EndpointStats) {
    if (change.value) {
      const addList = this.getSelectionRange<EndpointStats>(change, endpoint);
      this.endpointsSelectionChanged.emit([...this.selectedEndpoints, ...addList]);
    } else {
      const removeList = this.getDeselectionRange(change, endpoint);
      this.endpointsSelectionChanged.emit(this.selectedEndpoints.filter((ServingEndpoint) =>
        !removeList.includes(ServingEndpoint.id)));
    }
  }

  emitSelection(selection: EndpointStats[]) {
    this.endpointsSelectionChanged.emit(selection);
  }


  // addTag(tag: string) {
  //   this.store.dispatch(addTag({
  //     tag,
  //     models: this.selectedEndpoints.length > 1 ? this.selectedEndpoints : [this.contextEndpoint]
  //   }));
  //   this.filtersOptions[servingTableColFields.TAGS] = [];
  // }

  tableRowClicked(event: { e: Event; data: EndpointStats }) {
    this.endpointsSelectionChanged.emit([event.data]);
    this.endpointSelectionChanged.emit({endpoint: event.data, openInfo: !this.minimizedView})
  }

  columnFilterOpened(col: ISmCol) {
    this.sortOptionsList(col.id);
    // if (col.id === servingTableColFields.tags && !this.filtersOptions[servingTableColFields.tags]?.length) {
    if (false) { //lala - do we skip tags?
      this.tagsMenuOpened.emit();
    } else if (col.type === 'hyperparams') {
      this.store.dispatch(ServingActions.getCustomMetrics());
    }
  }

  columnsWidthChanged({columnId, width}) {
    const colIndex = this.tableCols.findIndex(col => col.id === columnId);
    const delta = width - parseInt(this.tableCols[colIndex].style.width, 10);
    this.table?.updateColumnsWidth(columnId, width, delta);
  }

  override updateSelectionState() {
    return;
  }

  openContextMenu(data: { e: Event; rowData; single?: boolean; backdrop?: boolean }) {
  }
}
