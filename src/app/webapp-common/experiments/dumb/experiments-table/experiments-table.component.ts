import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef
} from '@angular/core';
import {TIME_FORMAT_STRING} from '@common/constants';
import {ColHeaderTypeEnum, ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {FILTERED_EXPERIMENTS_STATUS_OPTIONS} from '../../shared/common-experiments.const';
import {get, uniq} from 'lodash-es';
import {FilterMetadata} from 'primeng/api/filtermetadata';
import {ITableExperiment} from '../../shared/common-experiment-model.model';
import {EXPERIMENTS_TABLE_COL_FIELDS} from '~/features/experiments/shared/experiments.const';
import {BaseTableView} from '@common/shared/ui-components/data/table/base-table-view';
import {getSystemTags, isDevelopment} from '~/features/experiments/shared/experiments.utils';
import {User} from '~/business-logic/model/users/user';
import {sortByArr} from '@common/shared/pipes/show-selected-first.pipe';
import {Store} from '@ngrx/store';
import {NoUnderscorePipe} from '@common/shared/pipes/no-underscore.pipe';
import {TitleCasePipe} from '@angular/common';
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
import {animate, style, transition, trigger} from '@angular/animations';

@Component({
    selector: 'sm-experiments-table',
    templateUrl: './experiments-table.component.html',
    styleUrls: ['./experiments-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{
            provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
            useValue: { showDelay: 500, position: 'above' } as MatTooltipDefaultOptions,
        }],
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
export class ExperimentsTableComponent extends BaseTableView implements OnInit, OnDestroy {
  readonly experimentsTableColFields = EXPERIMENTS_TABLE_COL_FIELDS;
  readonly timeFormatString = TIME_FORMAT_STRING;

  readonly getSystemTags = getSystemTags;
  public isDevelopment = isDevelopment;
  private _checkedExperiments: ITableExperiment[] = [];
  readonly colHeaderTypeEnum = ColHeaderTypeEnum;
  @Input() initialColumns = INITIAL_EXPERIMENT_TABLE_COLS;
  @Input() contextMenuTemplate: TemplateRef<{$implicit: IExperimentInfo}> = null;

  @Input() tableCols: ISmCol[];
  private _experiments: IExperimentInfo[] = [];
  private _selectedExperiment: IExperimentInfo;
  public roundedMetricValues: Record<string, Record<string, boolean>> = {};
  private _tableFilters: Record<string, FilterMetadata>;

  @Input() set experiments(experiments) {
    this._experiments = experiments;

    this.tableCols?.filter(tableCol => tableCol.id.startsWith('last_metrics')).forEach(col => experiments?.forEach(exp => {
      const value = get(exp, col.id);
      this.roundedMetricValues[col.id] = this.roundedMetricValues[col.id] || {};
      this.roundedMetricValues[col.id][exp.id] = value && getRoundedNumber(value) !== value;
    }));

    if (this.contextExperiment) {
      this.contextExperiment = this._experiments.find(experiment => experiment.id === this.contextExperiment.id);
    }
    if (experiments?.length > 0) {
      this.selectionChecked.enable();
    } else {
      this.selectionChecked.disable();
    }
  }

  get experiments() {
    return this._experiments;
  }

  public contextExperiment: IExperimentInfo | ISelectedExperiment;
  public filtersMatch: Record<string, string> = {};
  public filtersSubValues: Record<string, any> = {};
  private titleCasePipe = new TitleCasePipe();

  @Input() selectedExperimentsDisableAvailable: Record<string, CountAvailableAndIsDisableSelectedFiltered>;

  @Input() set users(users: User[]) {
    this.filtersOptions[EXPERIMENTS_TABLE_COL_FIELDS.USER] = users?.map(user => ({
      label: user.name ? user.name : 'Unknown User',
      value: user.id,
      tooltip: ''
    }));
    this.sortOptionsList(EXPERIMENTS_TABLE_COL_FIELDS.USER);
  }

  @Input() set hyperParamsOptions(hyperParamsOptions: Record<ISmCol['id'], string[]>) {
    Object.entries(hyperParamsOptions).forEach(([id, values]) => {
      this.filtersOptions[id] = values === null ? null : [{label: '(No Value)', value: null}].concat(values.map(value => ({
        label: value,
        value
      })));
      this.sortOptionsList(id);
    });
  }

  @Input() activeParentsFilter: ProjectsGetTaskParentsResponseParents[];


  @Input() set parents(parents: ProjectsGetTaskParentsResponseParents[]) {
    if (!parents) {
      this.filtersOptions[EXPERIMENTS_TABLE_COL_FIELDS.PARENT] = null;
      return;
    }
    const parentsAndActiveFilter = Array.from(new Set(parents.concat(this.activeParentsFilter || [])));
    this.filtersOptions[EXPERIMENTS_TABLE_COL_FIELDS.PARENT] = parentsAndActiveFilter.map(parent => ({
      label: parent.name ? parent.name : 'Unknown Experiment',
      value: parent.id,
      tooltip: `${parent.project?.name} / ${parent.name}`
    }));
    this.sortOptionsList(EXPERIMENTS_TABLE_COL_FIELDS.PARENT);
  }

  @Input() set checkedExperiments(experiments: ITableExperiment[]) {
    this._checkedExperiments = experiments;
    this.updateSelectionState();
  }

  get checkedExperiments(): ITableExperiment[] {
    return this._checkedExperiments;
  }

  @Input() set selectedExperiment(experiment: IExperimentInfo) {
    if (this._selectedExperiment?.id !== experiment?.id) {
      window.setTimeout(() => !this.contextMenuActive && this.table?.focusSelected());
    }
    this._selectedExperiment = experiment;
  }

  get selectedExperiment(): IExperimentInfo {
    return this._selectedExperiment;
  }

  @Input() noMoreExperiments: boolean;

  @Input() set tags(tags) {
    const tagsAndActiveFilter = uniqueFilterValueAndExcluded(tags, this.filtersValues[EXPERIMENTS_TABLE_COL_FIELDS.TAGS]);
    this.filtersOptions[EXPERIMENTS_TABLE_COL_FIELDS.TAGS] = tagsAndActiveFilter.map(tag => ({
      label: tag === null ? '(No tags)' : tag,
      value: tag
    }) as IOption);
    this.sortOptionalTagsList();
  }

  @Input() set experimentTypes(types: string[]) {
    const typesAndActiveFilter = uniq(types.concat(this.filtersValues[EXPERIMENTS_TABLE_COL_FIELDS.TYPE]));
    // under 4 letters assume an acronym and capitalize.
    this.filtersOptions[EXPERIMENTS_TABLE_COL_FIELDS.TYPE] = typesAndActiveFilter.map((type: string) =>
      ({
        label: (type?.length < 4 ? type.toUpperCase() : this.titleCasePipe.transform((new NoUnderscorePipe()).transform(type))),
        value: type
      })
    );
  }

  @Input() set projects(projects) {
    if (!projects) {
      this.filtersOptions[EXPERIMENTS_TABLE_COL_FIELDS.PROJECT] = null;
      return;
    }
    this.filtersOptions[EXPERIMENTS_TABLE_COL_FIELDS.PROJECT] = projects.map(project => ({
      label: project.name,
      value: project.id,
    }));
    this.sortOptionsList(EXPERIMENTS_TABLE_COL_FIELDS.PROJECT);
  }

  @Input() systemTags = [] as string[];
  @Input() cardHeight = 90;
  @Input() reorderableColumns = true;
  @Input() selectionReachedLimit: boolean;

  get validSystemTags() {
    return this.systemTags.filter(tag => tag !== 'archived');
  }

  @Input() set tableFilters(filters: Record<string, FilterMetadata>) {
    this._tableFilters = filters;
    this.filtersValues = {};
    this.filtersValues[EXPERIMENTS_TABLE_COL_FIELDS.STATUS] = filters?.[EXPERIMENTS_TABLE_COL_FIELDS.STATUS]?.value ?? [];
    this.filtersValues[EXPERIMENTS_TABLE_COL_FIELDS.TYPE] = filters?.[EXPERIMENTS_TABLE_COL_FIELDS.TYPE]?.value ?? [];
    this.filtersValues[EXPERIMENTS_TABLE_COL_FIELDS.USER] = filters?.[EXPERIMENTS_TABLE_COL_FIELDS.USER]?.value ?? [];
    this.filtersValues[EXPERIMENTS_TABLE_COL_FIELDS.TAGS] = filters?.[EXPERIMENTS_TABLE_COL_FIELDS.TAGS]?.value ?? [];
    this.filtersMatch[EXPERIMENTS_TABLE_COL_FIELDS.TAGS] = filters?.[EXPERIMENTS_TABLE_COL_FIELDS.TAGS]?.matchMode ?? '';
    this.filtersSubValues[EXPERIMENTS_TABLE_COL_FIELDS.TAGS] = filters?.system_tags?.value ?? [];
    this.filtersValues[EXPERIMENTS_TABLE_COL_FIELDS.PARENT] = filters?.parent?.['name']?.value ?? [];
    this.filtersValues[EXPERIMENTS_TABLE_COL_FIELDS.PROJECT] = filters?.project?.['name']?.value ?? [];
    this.filtersValues[EXPERIMENTS_TABLE_COL_FIELDS.VERSION] = filters?.hyperparams?.['properties']?.version?.value ?? null;
    this.filtersValues[EXPERIMENTS_TABLE_COL_FIELDS.LAST_UPDATE] = filters?.[EXPERIMENTS_TABLE_COL_FIELDS.LAST_UPDATE]?.value ?? [];
    this.filtersValues[EXPERIMENTS_TABLE_COL_FIELDS.STARTED] = filters?.[EXPERIMENTS_TABLE_COL_FIELDS.STARTED]?.value ?? [];

    // handle dynamic filters;
    const filtersValues = createFiltersFromStore(filters || {}, false);
    this.filtersValues = Object.assign({}, {...this.filtersValues}, {...filtersValues});
  }

  get tableFilters() {
    return this._tableFilters;
  }

  @Output() experimentSelectionChanged = new EventEmitter<{ experiment: ITableExperiment; openInfo?: boolean; origin: 'table' | 'row' }>();
  @Output() experimentsSelectionChanged = new EventEmitter<ITableExperiment[]>();
  @Output() loadMoreExperiments = new EventEmitter();
  @Output() sortedChanged = new EventEmitter<{ isShift: boolean; colId: ISmCol['id'] }>();
  @Output() tagsMenuOpened = new EventEmitter();
  @Output() typesMenuOpened = new EventEmitter();
  @Output() columnResized = new EventEmitter<{ columnId: string; widthPx: number }>();
  @Output() contextMenu = new EventEmitter<{ x: number; y: number; single?: boolean; backdrop?: boolean }>();
  @Output() removeTag = new EventEmitter<{ experiment: ITableExperiment; tag: string }>();
  @Output() clearAllFilters = new EventEmitter<Record<string, FilterMetadata>>();

  constructor(
    private changeDetector: ChangeDetectorRef,
    private store: Store,
    private router: Router
  ) {
    super();
    this.entitiesKey = 'experiments';
    this.selectedEntitiesKey = 'checkedExperiments';
    this.filtersOptions = {
      [EXPERIMENTS_TABLE_COL_FIELDS.STATUS]: [],
      [EXPERIMENTS_TABLE_COL_FIELDS.TYPE]: [],
      [EXPERIMENTS_TABLE_COL_FIELDS.USER]: [],
      [EXPERIMENTS_TABLE_COL_FIELDS.TAGS]: [],
      [EXPERIMENTS_TABLE_COL_FIELDS.PARENT]: null,
      [EXPERIMENTS_TABLE_COL_FIELDS.PROJECT]: null,
      [EXPERIMENTS_TABLE_COL_FIELDS.VERSION]: [],
    };
  }

  ngOnInit() {
    this.filtersOptions[EXPERIMENTS_TABLE_COL_FIELDS.STATUS] = FILTERED_EXPERIMENTS_STATUS_OPTIONS(this.entityType === EntityTypeEnum.dataset);
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  sortOptionalTagsList() {
    const selectedTags = (this.filtersValues[EXPERIMENTS_TABLE_COL_FIELDS.TAGS] || [])
      .map(tag => typeof tag === 'string' ? tag.replace(excludedKey, '') : tag);
    const tagsWithNull = [null].concat(selectedTags);
    this.filtersOptions[EXPERIMENTS_TABLE_COL_FIELDS.TAGS].sort((a, b) => sortByArr(a.value, b.value, tagsWithNull));
    this.filtersOptions = {
      ...this.filtersOptions,
      [EXPERIMENTS_TABLE_COL_FIELDS.TAGS]: [...this.filtersOptions[EXPERIMENTS_TABLE_COL_FIELDS.TAGS]]
    };
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
      this.experimentsSelectionChanged.emit([...this.checkedExperiments, ...addList]);
    } else {
      const removeList = this.getDeselectionRange(change, experiment as any);
      this.experimentsSelectionChanged.emit(this.checkedExperiments.filter((selectedExperiment) =>
        !removeList.includes(selectedExperiment.id)));
    }
  }

  tableRowClicked({e, data}: { e: MouseEvent; data: ITableExperiment }) {
    if (this.selectionMode === 'single') {
      this.experimentSelectionChanged.emit({experiment: data, origin: 'row'});
    }
    if (this._checkedExperiments.some(exp => exp.id === data.id)) {
      this.openContextMenu({e, rowData: data, backdrop: true});
    }
  }

  emitSelection(selection: any[]) {
    this.experimentsSelectionChanged.emit(selection);
  }

  openContextMenu(data: { e: Event; rowData; single?: boolean; backdrop?: boolean }) {
    if (!data?.single) {
      this.contextExperiment = this._experiments.find(experiment => experiment.id === data.rowData.id);
      if (!this.checkedExperiments.map(exp => exp.id).includes(this.contextExperiment.id)) {
        this.prevSelected = this.contextExperiment.id;
        this.emitSelection([this.contextExperiment]);
      }
    } else {
      this.contextExperiment = data.rowData;
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
    const colIndex = this.tableCols.findIndex(col => col.id === columnId);
    const delta = width - parseInt(this.tableCols[colIndex].style.width, 10);
    this.table?.updateColumnsWidth(columnId, width, delta);
  }

  columnFilterOpened(col: ISmCol) {
    this.sortOptionsList(col.id);
    if (col.id === EXPERIMENTS_TABLE_COL_FIELDS.TAGS) {
      if (!this.filtersOptions[EXPERIMENTS_TABLE_COL_FIELDS.TAGS]?.length) {
        this.tagsMenuOpened.emit();
      }
    } else if (col.id.includes('hyperparams')) {
      this.store.dispatch(hyperParamSelectedInfoExperiments({col: {id: col.id}, loadMore: false, values: []}));
      this.store.dispatch(setHyperParamsFiltersPage({page: 0}));
      this.store.dispatch(hyperParamSelectedExperiments({col, searchValue: ''}));
    } else if (col.id === EXPERIMENTS_TABLE_COL_FIELDS.PROJECT) {
      if (!this.filtersOptions[EXPERIMENTS_TABLE_COL_FIELDS.PROJECT]?.length) {
        this.filterSearchChanged.emit({colId: col.id, value: {value: ''}});
      }
    }
  }

  selectAll(filtered?: boolean) {
    this.store.dispatch(selectAllExperiments({filtered}));
  }
}
