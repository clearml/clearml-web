import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  EventEmitter,
  inject,
  input,
  output,
  Output,
  signal,
  TemplateRef
} from '@angular/core';
import {TIME_FORMAT_STRING} from '@common/constants';
import {ColHeaderTypeEnum, ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {get, uniq} from 'lodash-es';
import {FilterMetadata, PrimeTemplate} from 'primeng/api';
import {ITableExperiment} from '../../shared/common-experiment-model.model';
import {EXPERIMENTS_TABLE_COL_FIELDS} from '~/features/experiments/shared/experiments.const';
import {BaseTableView} from '@common/shared/ui-components/data/table/base-table-view';
import {getSystemTags, isDevelopment} from '~/features/experiments/shared/experiments.utils';
import {User} from '~/business-logic/model/users/user';
import {sortByArr} from '@common/shared/pipes/show-selected-first.pipe';
import {NoUnderscorePipe} from '@common/shared/pipes/no-underscore.pipe';
import {DatePipe, NgTemplateOutlet, TitleCasePipe} from '@angular/common';
import {INITIAL_EXPERIMENT_TABLE_COLS} from '../../experiment.consts';
import {
  ProjectsGetTaskParentsResponseParents
} from '~/business-logic/model/projects/projectsGetTaskParentsResponseParents';
import {Router} from '@angular/router';
import {
  IOption
} from '@common/shared/ui-components/inputs/select-autocomplete-for-template-forms/select-autocomplete-for-template-forms.component';
import {CountAvailableAndIsDisableSelectedFiltered} from '@common/shared/entity-page/items.utils';
import {
  hyperParamSelectedExperiments,
  hyperParamSelectedInfoExperiments,
  selectAllExperiments,
  setHyperParamsFiltersPage
} from '../../actions/common-experiments-view.actions';
import {createFiltersFromStore, excludedKey, uniqueFilterValueAndExcluded} from '@common/shared/utils/tableParamEncode';
import {getRoundedNumber} from '../../shared/common-experiments.utils';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions} from '@angular/material/tooltip';
import {IExperimentInfo, ISelectedExperiment} from '~/features/experiments/shared/experiment-info.model';
import {computedPrevious} from 'ngxtension/computed-previous';
import {FILTERED_EXPERIMENTS_STATUS_OPTIONS} from '~/features/experiments/experiments.consts';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {TableCardComponent} from '@common/shared/ui-components/data/table-card/table-card.component';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {
  TableFilterSortComponent
} from '@common/shared/ui-components/data/table/table-filter-sort/table-filter-sort.component';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {TagListComponent} from '@common/shared/ui-components/tags/tag-list/tag-list.component';
import {StatusIconLabelComponent} from '@common/shared/experiment-status-icon-label/status-icon-label.component';
import {
  TableCardFilterComponent
} from '@common/shared/ui-components/data/table/table-card-filter-template/table-card-filter.component';
import {
  MiniTagsListComponent
} from '@common/shared/ui-components/tags/user-tag/mini-tags-list/mini-tags-list.component';
import {
  ExperimentTypeIconLabelComponent
} from '@common/shared/experiment-type-icon-label/experiment-type-icon-label.component';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {
  HyperParamMetricColumnComponent
} from '@common/experiments/shared/components/hyper-param-metric-column/hyper-param-metric-column.component';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {ReactiveFormsModule} from '@angular/forms';
import {IsRowSelectedPipe} from '@common/shared/ui-components/data/table/is-rwo-selected.pipe';
import {ReplaceViaMapPipe} from '@common/shared/pipes/replaceViaMap';
import {DurationPipe} from '@common/shared/pipes/duration.pipe';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {FilterPipe} from '@common/shared/pipes/filter.pipe';

@Component({
  selector: 'sm-experiments-table',
  templateUrl: './experiments-table.component.html',
  styleUrls: ['./experiments-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
    useValue: {showDelay: 500, position: 'above'} as MatTooltipDefaultOptions,
  }],
  imports: [
    TooltipDirective,
    NgTemplateOutlet,
    TableCardComponent,
    TableComponent,
    TableFilterSortComponent,
    ShowTooltipIfEllipsisDirective,
    PrimeTemplate,
    TagListComponent,
    StatusIconLabelComponent,
    MiniTagsListComponent,
    ExperimentTypeIconLabelComponent,
    MatCheckbox,
    MatMenuItem,
    HyperParamMetricColumnComponent,
    TableCardFilterComponent,
    ClickStopPropagationDirective,
    ReactiveFormsModule,
    MatMenuTrigger,
    MatMenu,
    DatePipe,
    IsRowSelectedPipe,
    ReplaceViaMapPipe,
    DurationPipe,
    TimeAgoPipe,
    FilterPipe
  ]
})
export class ExperimentsTableComponent extends BaseTableView {
  override entitiesKey = 'experiments';
  override selectedEntitiesKey = 'checkedExperiments';
  readonly getSystemTags = getSystemTags;
  initialColumns = input(INITIAL_EXPERIMENT_TABLE_COLS);
  contextMenuTemplate = input<TemplateRef<{
    $implicit: IExperimentInfo;
  }>>(null);
  tableCols = input<ISmCol[]>();
  experiments = input<ITableExperiment[]>();
  selectedExperimentsDisableAvailable = input<Record<string, CountAvailableAndIsDisableSelectedFiltered>>();
  users = input<User[]>();
  hyperParamsOptions = input<Record<ISmCol['id'], string[]>>();
  activeParentsFilter = input<ProjectsGetTaskParentsResponseParents[]>();
  parents = input<ProjectsGetTaskParentsResponseParents[]>();
  checkedExperiments = input<ITableExperiment[]>();
  selectedExperiment = input<IExperimentInfo>();
  noMoreExperiments = input<boolean>();
  tags = input<string[]>();
  experimentTypes = input<string[]>();
  projects = input<ProjectsGetTaskParentsResponseParents[]>();
  systemTags = input([] as string[]);
  cardHeight = input(90);
  showColors = input(false);
  reorderableColumns = input(true);
  selectionReachedLimit = input<boolean>();
  tableFilters = input<Record<string, FilterMetadata>>({});
  experimentSelectionChanged = output<{
    experiment: ITableExperiment;
    openInfo?: boolean;
    origin: 'table' | 'row';
  }>();
  experimentsSelectionChanged = output<ITableExperiment[]>();
  loadMoreExperiments = output();
  sortedChanged = output<{
    isShift: boolean;
    colId: ISmCol['id'];
  }>();
  tagsMenuOpened = output();
  typesMenuOpened = output();
  columnResized = output<{
    columnId: string;
    widthPx: number;
  }>();
  contextMenu = output<{
    x: number;
    y: number;
    single?: boolean;
    backdrop?: boolean;
  }>();
  @Output() removeTag = new EventEmitter<{
    experiment: ITableExperiment;
    tag: string;
  }>();
  clearAllFilters = output<Record<string, FilterMetadata>>();
  protected readonly experimentsTableColFields = EXPERIMENTS_TABLE_COL_FIELDS;
  protected readonly timeFormatString = TIME_FORMAT_STRING;
  protected isDevelopment = isDevelopment;
  protected readonly colHeaderTypeEnum = ColHeaderTypeEnum;
  protected roundedMetricValues = computed<Record<string, Record<string, boolean>>>(() => {
    const roundedMetricValues = {};
    this.tableCols()
      ?.filter(tableCol => tableCol.id.startsWith('last_metrics'))
      .forEach(col => this.experiments()?.forEach(exp => {
          const value = get(exp, col.id);
          roundedMetricValues[col.id] = roundedMetricValues[col.id] || {};
          roundedMetricValues[col.id][exp.id] = value && getRoundedNumber(value) !== value;
        })
      );
    return roundedMetricValues;
  });
  protected contextExperiment = signal<IExperimentInfo | ISelectedExperiment>(null);
  protected filtersValues = computed<Record<string, string[]>>(() => {
    const filters = this.tableFilters();
    const filtersValues = {
      [EXPERIMENTS_TABLE_COL_FIELDS.STATUS]: filters?.[EXPERIMENTS_TABLE_COL_FIELDS.STATUS]?.value ?? [],
      [EXPERIMENTS_TABLE_COL_FIELDS.TYPE]: filters?.[EXPERIMENTS_TABLE_COL_FIELDS.TYPE]?.value ?? [],
      [EXPERIMENTS_TABLE_COL_FIELDS.USER]: filters?.[EXPERIMENTS_TABLE_COL_FIELDS.USER]?.value ?? [],
      [EXPERIMENTS_TABLE_COL_FIELDS.TAGS]: filters?.[EXPERIMENTS_TABLE_COL_FIELDS.TAGS]?.value ?? [],
      [EXPERIMENTS_TABLE_COL_FIELDS.PARENT]: filters?.parent?.['name']?.value ?? [],
      [EXPERIMENTS_TABLE_COL_FIELDS.PROJECT]: filters?.project?.['name']?.value ?? [],
      [EXPERIMENTS_TABLE_COL_FIELDS.VERSION]: filters?.hyperparams?.['properties']?.version?.value ?? null,
      [EXPERIMENTS_TABLE_COL_FIELDS.LAST_UPDATE]: filters?.[EXPERIMENTS_TABLE_COL_FIELDS.LAST_UPDATE]?.value ?? [],
      [EXPERIMENTS_TABLE_COL_FIELDS.STARTED]: filters?.[EXPERIMENTS_TABLE_COL_FIELDS.STARTED]?.value ?? []
    };
    // handle dynamic filters;
    const storeValues = createFiltersFromStore(filters || {}, false);
    return {...filtersValues, ...storeValues};
  });
  protected sortByFilterValues = signal<Record<string, string[]>>(this.filtersValues());
  protected filtersSubValues = computed(() => ({
    [EXPERIMENTS_TABLE_COL_FIELDS.TAGS]: this.tableFilters()?.system_tags?.value ?? [],
  }));
  protected filtersMatch = computed(() => ({
    [EXPERIMENTS_TABLE_COL_FIELDS.TAGS]: this.tableFilters()?.[EXPERIMENTS_TABLE_COL_FIELDS.TAGS]?.matchMode ?? ''
  }), {equal: () => Object.keys(this.tableFilters() ?? {}).length === 0}); //Don't reset match mode when remove all filters
  private router = inject(Router);
  private readonly titleCasePipe = new TitleCasePipe();
  protected filtersOptions = computed(() => ({
    [EXPERIMENTS_TABLE_COL_FIELDS.STATUS]: FILTERED_EXPERIMENTS_STATUS_OPTIONS(this.entityType() === EntityTypeEnum.dataset),
    [EXPERIMENTS_TABLE_COL_FIELDS.TYPE]: uniq((this.experimentTypes() ?? []).concat(this.filtersValues[EXPERIMENTS_TABLE_COL_FIELDS.TYPE]))
      .filter(type => !!type)
      .map((type: string) => ({
        label: (type?.length < 4 ? type.toUpperCase() : this.titleCasePipe.transform((new NoUnderscorePipe()).transform(type))),
        value: type
      })),
    [EXPERIMENTS_TABLE_COL_FIELDS.USER]: this.sortOptionsList(this.users()?.map(user => ({
      label: user.name ? user.name : 'Unknown User',
      value: user.id,
      tooltip: ''
    })) ?? [], [this.currentUserId(), ...this.sortByFilterValues()[EXPERIMENTS_TABLE_COL_FIELDS.USER]]),
    [EXPERIMENTS_TABLE_COL_FIELDS.TAGS]: this.calcOptionalTagsList(),
    [EXPERIMENTS_TABLE_COL_FIELDS.PARENT]: !this.parents() ? null :
      this.sortOptionsList(
        Array.from(new Set(this.parents().concat(this.activeParentsFilter() || [])))
          .map(parent => ({
            label: parent.name ? parent.name : 'Unknown Experiment',
            value: parent.id,
            tooltip: `${parent.project?.name} / ${parent.name}`
          })),
        this.sortByFilterValues()[EXPERIMENTS_TABLE_COL_FIELDS.PARENT]
      ),
    [EXPERIMENTS_TABLE_COL_FIELDS.PROJECT]: !this.projects() ? null :
      this.sortOptionsList(
        this.projects().map(project => ({
          label: project.name,
          value: project.id,
        })),
        this.sortByFilterValues()[EXPERIMENTS_TABLE_COL_FIELDS.PROJECT]
      ),
    [EXPERIMENTS_TABLE_COL_FIELDS.VERSION]: [],
    ...Object.entries(this.hyperParamsOptions() ?? []).reduce((acc, [id, values]) => {
      acc[id] = values === null ?
        null :
        this.sortOptionsList([{label: '(No Value)', value: null}].concat(values.map(value => ({
          label: value,
          value
        }))), this.sortByFilterValues()[id]);
      return acc;
    }, {})
  }));
  private prevExperiment = computedPrevious(this.selectedExperiment);

  constructor() {
    super();

    effect(() => {
      if (this.experiments()?.length > 0) {
        this.selectionChecked.enable();
      } else {
        this.selectionChecked.disable();
      }
    });

    effect(() => {
      if (this.prevExperiment()?.id !== this.selectedExperiment()?.id) {
        window.setTimeout(() => !this.contextMenuActive() && this.table()?.focusSelected());
      }
    });
  }

  calcOptionalTagsList() {
    const tags = uniqueFilterValueAndExcluded(this.tags() || [], this.filtersValues()[EXPERIMENTS_TABLE_COL_FIELDS.TAGS])
      .map(tag => ({
        label: tag === null ? '(No tags)' : tag,
        value: tag
      }) as IOption);
    const selectedTags = (this.sortByFilterValues()[EXPERIMENTS_TABLE_COL_FIELDS.TAGS] || [])
      .map(tag => typeof tag === 'string' ? tag.replace(excludedKey, '') : tag);
    const tagsWithNull = [null].concat(selectedTags);
    tags.sort((a, b) => sortByArr(a.value, b.value, tagsWithNull));
    return tags;
  }

  onLoadMoreClicked() {
    this.loadMoreExperiments.emit();
  }

  onSortChanged(isShift: boolean, colId: ISmCol['id']) {
    this.sortedChanged.emit({isShift, colId});
    this.scrollTableToTop();
  }

  rowSelectedChanged(change: { value: boolean; event: Event }, experiment: ITableExperiment) {
    if (change.value) {
      const addList = this.getSelectionRange<ITableExperiment>(change, experiment);
      this.experimentsSelectionChanged.emit([...this.checkedExperiments(), ...addList]);
    } else {
      const removeList = this.getDeselectionRange(change, experiment);
      this.experimentsSelectionChanged.emit(this.checkedExperiments().filter((selectedExperiment) =>
        !removeList.includes(selectedExperiment.id)));
    }
  }

  tableRowClicked({e, data}: { e: MouseEvent; data: ITableExperiment }) {
    if (this.selectionMode() === 'single') {
      this.experimentSelectionChanged.emit({experiment: data, origin: 'row'});
    }
    if (this.checkedExperiments()?.some(exp => exp.id === data.id)) {
      this.openContextMenu({e, rowData: data, backdrop: true});
    }
  }

  emitSelection(selection: ISelectedExperiment[]) {
    this.experimentsSelectionChanged.emit(selection);
  }

  openContextMenu(data: { e: Event; rowData; single?: boolean; backdrop?: boolean }) {
    if (!data?.single) {
      this.contextExperiment.set(this.experiments().find(experiment => experiment.id === data.rowData.id));
      if (!this.checkedExperiments().map(exp => exp.id).includes(this.contextExperiment().id)) {
        this.prevSelected = this.contextExperiment().id;
        this.emitSelection([this.contextExperiment() as ISelectedExperiment]);
      }
    } else {
      this.contextExperiment.set(data.rowData);
    }
    const event = data.e as MouseEvent;
    event.preventDefault();
    this.contextMenu.emit({x: event.clientX, y: event.clientY, single: data?.single, backdrop: data?.backdrop});
  }


  navigateToParent(event: MouseEvent, experiment: ITableExperiment) {
    event.stopPropagation();
    return this.router.navigate(['projects', experiment.parent.project?.id || '*', 'tasks', experiment.parent.id],
      {queryParams: {filter: []}});
  }

  columnsWidthChanged({columnId, width}) {
    const colIndex = this.tableCols().findIndex(col => col.id === columnId);
    const delta = width - parseInt(this.tableCols()[colIndex].style.width, 10);
    this.table()?.updateColumnsWidth(columnId, width, delta);
  }

  columnFilterOpened(col: ISmCol) {
    this.sortByFilterValues.set(this.filtersValues());
    if (col.id === EXPERIMENTS_TABLE_COL_FIELDS.TAGS) {
      if (!this.filtersOptions()[EXPERIMENTS_TABLE_COL_FIELDS.TAGS]?.length) {
        this.tagsMenuOpened.emit();
      }
    } else if (col.id.includes('hyperparams')) {
      this.store.dispatch(hyperParamSelectedInfoExperiments({col: {id: col.id}, loadMore: false, values: []}));
      this.store.dispatch(setHyperParamsFiltersPage({page: 0}));
      this.store.dispatch(hyperParamSelectedExperiments({col, searchValue: ''}));
    } else if (col.id === EXPERIMENTS_TABLE_COL_FIELDS.PROJECT) {
      if (!this.filtersOptions()[EXPERIMENTS_TABLE_COL_FIELDS.PROJECT]?.length) {
        this.filterSearchChanged.emit({colId: col.id, value: {value: ''}});
      }
    }
  }

  selectAll(filtered?: boolean) {
    this.store.dispatch(selectAllExperiments({filtered}));
  }
}
