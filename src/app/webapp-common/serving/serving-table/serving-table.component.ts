import {ChangeDetectionStrategy, Component, computed, effect, input, output, signal} from '@angular/core';
import {TIME_FORMAT_STRING} from '@common/constants';
import {FilterMetadata} from 'primeng/api';
import {get, parseInt} from 'lodash-es';
import {getRoundedNumber} from '@common/experiments/shared/common-experiments.utils';
import {ColHeaderTypeEnum, ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {createFiltersFromStore} from '@common/shared/utils/tableParamEncode';
import {animate, style, transition, trigger} from '@angular/animations';
import {BaseTableView} from '@common/shared/ui-components/data/table/base-table-view';
import {ServingActions, servingLoadingTableColFields, servingTableColFields} from '@common/serving/serving.actions';
import {servingTableCols} from '@common/serving/serving.consts';
import {EndpointStats} from '~/business-logic/model/serving/endpointStats';
import { EntityTypeEnum } from '~/shared/constants/non-common-consts';
import {fileSizeConfigCount, fileSizeConfigStorage} from '@common/shared/pipes/filesize.pipe';
import {computedPrevious} from 'ngxtension/computed-previous';

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
export class ServingTableComponent extends BaseTableView {
  override entitiesKey = 'endpoints';

  readonly endpointsTableColFields = servingTableColFields;
  readonly endpointsLoadingTableColFields = servingLoadingTableColFields;
  protected readonly EntityTypeEnum = EntityTypeEnum;
  protected readonly fileSizeConfigCount = fileSizeConfigCount;
  protected readonly fileSizeConfigStorage = fileSizeConfigStorage;
  readonly timeFormatString = TIME_FORMAT_STRING;
  protected contextEndpoint = signal<EndpointStats>(null);

  // protected tagsFilterByProject$ = this.store.select(selectTagsFilterByProject);
  // protected projectTags$ = this.store.select(selectProjectTags);
  // protected companyTags$ = this.store.select(selectCompanyTags);

  public filtersMatch: Record<string, string> = {};
  public singleRowContext: boolean;
  protected readonly servingTableColFields = servingTableColFields;
  endpoints = input<EndpointStats[]>();
  reorderableColumns = input(true);
  tableCols = input<ISmCol[]>();
  enableMultiSelect = input<boolean>();
  modelNames = input<string[]>();
  inputTypes = input<string[]>();
  preprocessArtifact = input<string[]>();
  selectedEndpoints = input<EndpointStats[]>();
  selectedEndpoint = input<EndpointStats>();
  prevSelectedEndpoint = computedPrevious(this.selectedEndpoint);
  tableFilters = input<Record<string, FilterMetadata>>();
  metadataValuesOptions = input<Record<ISmCol['id'], string[]>>();
  systemTags = input([] as string[]);

  // @Input() set users(users: User[]) {
  //   this.filtersOptions[servingTableColFields.USER] = users.map(user => ({
  //     label: user.name ? user.name : 'Unknown User',
  //     value: user.id
  //   }));
  //   this.sortOptionsList(servingTableColFields.USER);
  // }

  // @Input() set tags(tags) {
  //   const tagsAndActiveFilter = Array.from(new Set(tags.concat(this.filtersValues[servingTableColFields.tags])));
  //   this.filtersOptions[servingTableColFields.tags] = tagsAndActiveFilter.map(tag => ({
  //     label: tag === null ? '(No tags)' : tag,
  //     value: tag
  //   }) as IOption);
  //   this.sortOptionsList(servingTableColFields.tags);
  // }


  endpointsSelectionChanged = output<EndpointStats[]>();
  endpointSelectionChanged = output<{
        endpoint: EndpointStats;
        openInfo?: boolean;
    }>();
  loadMoreEndpoints = output();
  tagsMenuOpened = output();
  sortedChanged = output<{
        isShift: boolean;
        colId: ISmCol['id'];
    }>();
  columnResized = output<{
        columnId: string;
        widthPx: number;
    }>();
  clearAllFilters = output<Record<string, FilterMetadata>>();

  public readonly initialColumns = servingTableCols;


  protected columns = computed(() => this.tableCols()
    .map(col => {
      if (col.headerType != ColHeaderTypeEnum.checkBox && col.style?.width?.endsWith('px')) {
        const width = parseInt(col.style.width, 10);
        return {...col, style: {...col.style, width: width + 'px'}};
      }
      return col;
    })
  );

  protected roundedMetricValues = computed<Record<string, Record<string, boolean>> >(() => {
    const roundedMetricValues = {};
    this.tableCols()
      ?.filter(tableCol => tableCol.id.startsWith('last_metrics'))
      .forEach(col => this.endpoints()?.forEach(exp => {
          const value = get(exp, col.id);
          roundedMetricValues[col.id] = roundedMetricValues[col.id] || {};
          roundedMetricValues[col.id][exp.id] = value && getRoundedNumber(value) !== value;
        })
      );
    return roundedMetricValues;
  });

  protected filtersValues = computed(() => {
    const filters = this.tableFilters();
    return {
      [servingTableColFields.modelName]: filters?.[servingTableColFields.modelName] ?? null,
      [servingTableColFields.endpointURL]: filters?.[servingTableColFields.endpointURL] ?? null,
      [servingTableColFields.totalRequests]: filters?.[servingTableColFields.totalRequests] ?? null,
      [servingTableColFields.uptime]: filters?.[servingTableColFields.uptime] ?? null,
      [servingTableColFields.rpm]: filters?.[servingTableColFields.rpm] ?? null,
      [servingTableColFields.latency]: filters?.[servingTableColFields.latency] ?? null,
      [servingTableColFields.instances]: filters?.[servingTableColFields.instances] ?? null,
      [servingLoadingTableColFields.inputType]: filters?.[servingLoadingTableColFields.inputType] ?? null,
      [servingLoadingTableColFields.preprocessArtifact]: filters?.[servingLoadingTableColFields.preprocessArtifact] ?? null,
      // [servingTableColFields.tags]: filters?.[servingTableColFields.tags] ?? null,
      ...createFiltersFromStore(filters || {}, false)
    };
  });

  protected filtersOptions = computed(() => ({
    [servingTableColFields.modelName]: this.sortOptionsList(
      this.modelNames().map(modelName => ({
        label: modelName,
        value: modelName
      })),
      this.filtersValues()[servingTableColFields.modelName]
    ),
    [servingLoadingTableColFields.inputType]: this.sortOptionsList(
      this.inputTypes().map(inputType => ({
        label: inputType,
        value: inputType
      })),
      this.filtersValues()[servingLoadingTableColFields.inputType]
    ),
    [servingLoadingTableColFields.preprocessArtifact]: this.sortOptionsList(
      this.preprocessArtifact().map(preprocessArtifact => ({
        label: preprocessArtifact,
        value: preprocessArtifact
      })),
      this.filtersValues()[servingLoadingTableColFields.preprocessArtifact]
    ),
    ...Object.entries(this.metadataValuesOptions() || {}).reduce((acc, [id, values]) => {
      acc![id] = values === null ? null : [{
        label: '(No Value)',
        value: null
      }].concat(values.map(value => ({
        label: value,
        value
      })));
      return acc;
    }, {})
  }));

  constructor() {
    super();

    effect(() => {
      if (this.prevSelectedEndpoint()?.id !== this.selectedEndpoint()?.id) {
        window.setTimeout(() => !this.contextMenuActive() && this.table()?.focusSelected());
      }
    });
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
    return this.tableCols()?.filter(col => col.sortable);
  }

  getColName(colId: ISmCol['id']) {
    return this.tableCols()?.find(col => colId === col.id)?.header;
  }

  rowSelectedChanged(change: { field: string; value: boolean; event: Event }, endpoint: EndpointStats) {
    if (change.value) {
      const addList = this.getSelectionRange<EndpointStats>(change, endpoint);
      this.endpointsSelectionChanged.emit([...this.selectedEndpoints(), ...addList]);
    } else {
      const removeList = this.getDeselectionRange(change, endpoint);
      this.endpointsSelectionChanged.emit(this.selectedEndpoints().filter((ServingEndpoint) =>
        !removeList.includes(ServingEndpoint.id)));
    }
  }

  emitSelection(selection: EndpointStats[]) {
    this.endpointsSelectionChanged.emit(selection);
  }


  // addTag(tag: string) {
  //   this.store.dispatch(addTag({
  //     tag,
  //     models: this.selectedEndpoints().length > 1 ? this.selectedEndpoints() : [this.contextEndpoint]
  //   }));
  //   this.filtersOptions[servingTableColFields.TAGS] = [];
  // }

  tableRowClicked(event: { e: Event; data: EndpointStats }) {
    this.endpointsSelectionChanged.emit([event.data]);
    this.endpointSelectionChanged.emit({endpoint: event.data, openInfo: !this.minimizedView()})
  }

  columnFilterOpened(col: ISmCol) {
    if (col.type !== 'hyperparams') {
      this.store.dispatch(ServingActions.getCustomMetrics());
    }
  }

  columnsWidthChanged({columnId, width}) {
    const colIndex = this.tableCols().findIndex(col => col.id === columnId);
    const delta = width - parseInt(this.tableCols()[colIndex].style.width, 10);
    this.table()?.updateColumnsWidth(columnId, width, delta);
  }

  openContextMenu(data: { e: Event; rowData; single?: boolean; backdrop?: boolean }) {
  }
}
