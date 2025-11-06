import {
  ChangeDetectionStrategy,
  Component,
  OnChanges, viewChild, output, input, computed, signal, effect, Output, EventEmitter
} from '@angular/core';
import {ColHeaderTypeEnum, ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {get} from 'lodash-es';
import {SelectedModel, TableModel} from '../models.model';
import {MODELS_READY_LABELS, MODELS_TABLE_COL_FIELDS} from '../models.const';
import {FilterMetadata} from 'primeng/api';
import {BaseTableView} from '@common/shared/ui-components/data/table/base-table-view';
import {User} from '~/business-logic/model/users/user';
import {selectCompanyTags, selectProjectTags, selectTagsFilterByProject} from '@common/core/reducers/projects.reducer';
import {addTag} from '../../actions/models-menu.actions';
import {TIME_FORMAT_STRING} from '@common/constants';
import {getSysTags} from '../../model.utils';
import {MODELS_TABLE_COLS} from '../../models.consts';
import {
  IOption
} from '@common/shared/ui-components/inputs/select-autocomplete-for-template-forms/select-autocomplete-for-template-forms.component';
import {
  CountAvailableAndIsDisableSelectedFiltered,
  MenuItems,
  selectionDisabledArchive,
  selectionDisabledDelete,
  selectionDisabledMoveTo,
  selectionDisabledPublishModels
} from '@common/shared/entity-page/items.utils';
import {getCustomMetrics, getModelsMetadataValuesForKey, selectAllModels} from '../../actions/models-view.actions';
import {
  ModelMenuExtendedComponent
} from '~/features/models/containers/model-menu-extended/model-menu-extended.component';
import {createFiltersFromStore, uniqueFilterValueAndExcluded} from '@common/shared/utils/tableParamEncode';
import {getRoundedNumber} from '@common/experiments/shared/common-experiments.utils';
import {animate, style, transition, trigger} from '@angular/animations';
import {Project} from '~/business-logic/model/projects/project';
import {computedPrevious} from 'ngxtension/computed-previous';
import {EXPERIMENTS_TABLE_COL_FIELDS} from '~/features/experiments/shared/experiments.const';

@Component({
    selector: 'sm-models-table',
    templateUrl: './models-table.component.html',
    styleUrls: ['./models-table.component.scss'],
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
export class ModelsTableComponent extends BaseTableView implements OnChanges {
  override entitiesKey = 'models';
  override selectedEntitiesKey = 'checkedModels';
  protected readonly modelsTableColFields = MODELS_TABLE_COL_FIELDS;
  protected readonly modelsReadyOptions = Object.entries(MODELS_READY_LABELS).map(([key, val]) => ({label: val, value: key}));
  protected readonly timeFormatString = TIME_FORMAT_STRING;

  public getSysTags = getSysTags;
  public singleRowContext: boolean;

  models = input<SelectedModel[]>();
  noMoreModels = input<boolean>();
  reorderableColumns = input(true);
  tableCols = input<ISmCol[]>();
  enableMultiSelect = input<boolean>();
  onlyPublished = input<boolean>();
  projects = input([] as Project[]);
  checkedModels = input<TableModel[]>([]);
  selectedModelsDisableAvailable = input<Record<string, CountAvailableAndIsDisableSelectedFiltered>>({});
  selectedModel = input<SelectedModel>(null);
  private prevSelectedModel = computedPrevious(this.selectedModel);
  tableFilters = input<Record<string, FilterMetadata>>({});
  users = input<User[]>([]);
  metadataValuesOptions = input<Record<ISmCol['id'], string[]>>();
  frameworks = input<string[]>([]);
  tags = input<string[]>([]);
  modelsProjectTags = input<string[]>([]);
  systemTags = input([] as string[]);
  columnResizeMode = input('expand' as 'fit' | 'expand');

  @Output() modelsSelectionChanged = new EventEmitter<SelectedModel[]>();
  modelSelectionChanged = output<{
        model: SelectedModel;
        openInfo?: boolean;
        origin: 'row' | 'table';
    }>();
  loadMoreModels = output();
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

  protected tagsFilterByProject = this.store.selectSignal(selectTagsFilterByProject);
  protected projectTags = this.store.selectSignal(selectProjectTags);
  protected companyTags = this.store.selectSignal(selectCompanyTags);
  contextMenuExtended = viewChild<ModelMenuExtendedComponent>('contextMenuExtended');
  public readonly initialColumns = MODELS_TABLE_COLS;

  protected roundedMetricValues = computed<Record<string, Record<string, boolean>> >(() => {
    const roundedMetricValues = {};
    this.tableCols()
      ?.filter(tableCol => tableCol.id.startsWith('last_metrics'))
      .forEach(col => this.models()?.forEach(exp => {
          const value = get(exp, col.id);
          roundedMetricValues[col.id] = roundedMetricValues[col.id] || {};
          roundedMetricValues[col.id][exp.id] = value && getRoundedNumber(value) !== value;
        })
      );
    return roundedMetricValues;
  });
  protected contextModel = signal<SelectedModel>(null);
  protected columns = computed(() => this.tableCols()
    .map(col => col.id === MODELS_TABLE_COL_FIELDS.READY ? {...col, hidden: this.onlyPublished()} : col)
    .map(col => {
      if (col.headerType != ColHeaderTypeEnum.checkBox && col.style?.width?.endsWith('px')) {
        const width = parseInt(col.style.width, 10);
        return {...col, style: {...col.style, width: width + 'px'}};
      }
      return col;
    })
  );

  protected singleSelectedModelsDisableAvailable = computed(() => {
    const model = this.selectedModel() ? this.selectedModel() : this.contextModel();
    return {[MenuItems.publish]: selectionDisabledPublishModels([model]),
      [MenuItems.moveTo]: selectionDisabledMoveTo([model]),
      [MenuItems.delete]: selectionDisabledDelete([model]),
      [MenuItems.archive]: selectionDisabledArchive([model])}
  });

  protected filtersValues = computed<Record<string, string[]>>(() => {
    const filters = this.tableFilters();
    const filtersValues = {
      [MODELS_TABLE_COL_FIELDS.FRAMEWORK]: filters?.[MODELS_TABLE_COL_FIELDS.FRAMEWORK]?.value ?? [],
      [MODELS_TABLE_COL_FIELDS.READY]: filters?.[MODELS_TABLE_COL_FIELDS.READY]?.value ?? [],
      [MODELS_TABLE_COL_FIELDS.USER]: get(filters, [MODELS_TABLE_COL_FIELDS.USER, 'value'], []),
      [MODELS_TABLE_COL_FIELDS.TAGS]: filters?.[MODELS_TABLE_COL_FIELDS.TAGS]?.value ?? [],
      [MODELS_TABLE_COL_FIELDS.PROJECT]: get(filters, [MODELS_TABLE_COL_FIELDS.PROJECT, 'value'], []),
    };
    // handle dynamic filters;
    const storeValues = createFiltersFromStore(filters || {}, false);
    return {...filtersValues, ...storeValues};
  });

  protected filtersOptions = computed(() => ({
    [MODELS_TABLE_COL_FIELDS.FRAMEWORK]: this.sortOptionsList(
      Array.from(new Set(this.frameworks().concat(this.filtersValues()[MODELS_TABLE_COL_FIELDS.FRAMEWORK]))).map(framework =>
        ({
          label: framework ? framework :
            (framework === null ? '(No framework)' : 'Unknown'), value: framework
        })
      ),
      this.filtersValues()[MODELS_TABLE_COL_FIELDS.FRAMEWORK]
    ),
    [MODELS_TABLE_COL_FIELDS.READY]: this.modelsReadyOptions,
    [MODELS_TABLE_COL_FIELDS.USER]: this.sortOptionsList(this.users()?.map(user => ({
      label: user.name ? user.name : 'Unknown User',
      value: user.id,
      tooltip: ''
    })) ?? [], this.filtersValues()[MODELS_TABLE_COL_FIELDS.USER]),
    [MODELS_TABLE_COL_FIELDS.TAGS]: this.calcOptionalTagsList(),
    [MODELS_TABLE_COL_FIELDS.PROJECT]: !this.projects() ? null :
      this.sortOptionsList(
        this.projects().map(project => ({
          label: project.name,
          value: project.id,
        })),
        this.filtersValues()[MODELS_TABLE_COL_FIELDS.PROJECT]
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

  protected filtersSubValues = computed(() => ({
    [EXPERIMENTS_TABLE_COL_FIELDS.TAGS]: this.tableFilters()?.system_tags?.value ?? [],
  }));

  protected filtersMatch = computed(() => ({
    [EXPERIMENTS_TABLE_COL_FIELDS.TAGS]: this.tableFilters()?.[EXPERIMENTS_TABLE_COL_FIELDS.TAGS]?.matchMode ?? ''
  }), {equal: () => Object.keys(this.tableFilters() ?? {}).length === 0}); //Don't reset match mode when remove all filters);

  constructor() {
    super();

    effect(() => {
      if (this.selectedModel() && this.selectedModel().id !== this.prevSelectedModel()?.id) {
        window.setTimeout(() => this.table()?.focusSelected());
      }
    });
  }

  ngOnChanges() {
    if (this.tableCols()?.length > 0) {
      this.tableCols()[0].hidden = this.enableMultiSelect() === false;
      const statusColumn = this.tableCols().find(col => col.id === 'ready');
      if (statusColumn) {
        statusColumn.filterable = this.enableMultiSelect();
        statusColumn.sortable = this.enableMultiSelect();
      }
    }
  }

  calcOptionalTagsList() {
    const tagsAndActiveFilter = uniqueFilterValueAndExcluded(this.tags(), this.filtersValues[MODELS_TABLE_COL_FIELDS.TAGS]);
    return this.sortOptionsList(tagsAndActiveFilter.map(tag => ({
        label: tag === null ? '(No tags)' : tag,
        value: tag
      }) as IOption),
      this.filtersValues[MODELS_TABLE_COL_FIELDS.TAGS]
    );
  }

  onRowSelectionChanged(event) {
    this.modelSelectionChanged.emit({model: event.data, origin: 'table'});
  }


  onLoadMoreClicked() {
    this.loadMoreModels.emit();
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

  rowSelectedChanged(change: { value: boolean; event: Event }, model: TableModel) {
    if (change.value) {
      const addList = this.getSelectionRange<TableModel>(change, model);
      this.modelsSelectionChanged.emit([...this.checkedModels(), ...addList]);
    } else {
      const removeList = this.getDeselectionRange(change, model);
      this.modelsSelectionChanged.emit(this.checkedModels().filter((selectedModel) =>
        !removeList.includes(selectedModel.id)));
    }
  }

  selectAll(filtered = false) {
    this.store.dispatch(selectAllModels({filtered}));
  }

  emitSelection(selection: SelectedModel[]) {
    this.modelsSelectionChanged.emit(selection);
  }


  addTag(tag: string) {
    this.store.dispatch(addTag({
      tag,
      models: this.checkedModels().length > 1 ? this.checkedModels() : [this.contextModel()]
    }));
    this.filtersOptions()[MODELS_TABLE_COL_FIELDS.TAGS] = [];
  }

  tableRowClicked({e, data}: { e: Event; data: SelectedModel }) {
    if (this.selectionMode() === 'single') {
      this.modelSelectionChanged.emit({model: data, origin: 'row'});
    }
    if (this.checkedModels().some(exp => exp.id === data.id)) {
      this.openContextMenu({e: e, rowData: data, backdrop: true});
    }
  }

  openContextMenu(data: { e: Event; rowData; single?: boolean; backdrop?: boolean }) {
    if (!this.modelsSelectionChanged.observed) {
      return;
    }
    this.singleRowContext = !!data?.single;
    this.menuBackdrop = !!data?.backdrop;
    if (!data?.single) {
      this.contextModel.set(this.models().find(model => model.id === data.rowData.id));
      if (!this.checkedModels().map(model => model.id).includes(this.contextModel().id)) {
        this.prevSelected = this.contextModel().id;
        this.emitSelection([this.contextModel()]);
      }
    } else {
      this.contextModel.set(data.rowData);
    }

    const event = data.e as MouseEvent;
    event.preventDefault();
    this.contextMenuExtended()?.contextMenu().openMenu({x: event.clientX, y: event.clientY});
  }

  columnFilterOpened(col: ISmCol) {
    // this.sortOptionsList(col.id);
    if (col.id === MODELS_TABLE_COL_FIELDS.TAGS && !this.filtersOptions[MODELS_TABLE_COL_FIELDS.TAGS]?.length) {
      this.tagsMenuOpened.emit();
    } else if (col.type === 'metadata') {
      this.store.dispatch(getModelsMetadataValuesForKey({col}));
    } else if (col.type === 'hyperparams') {
      this.store.dispatch(getCustomMetrics());
    } else if (col.id === MODELS_TABLE_COL_FIELDS.PROJECT) {
      if (!this.filtersOptions[MODELS_TABLE_COL_FIELDS.PROJECT]?.length) {
        this.filterSearchChanged.emit({colId: col.id, value: {value: ''}});
      }
    }
  }

  columnsWidthChanged({columnId, width}) {
    const colIndex = this.tableCols().findIndex(col => col.id === columnId);
    const delta = width - parseInt(this.tableCols()[colIndex].style.width, 10);
    this.table()?.updateColumnsWidth(columnId, width, delta);
  }
}
