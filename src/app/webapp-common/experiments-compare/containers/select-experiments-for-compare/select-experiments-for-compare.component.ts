import {ChangeDetectionStrategy, Component, computed, effect, EventEmitter, inject, input, OnDestroy, OnInit, output, signal, viewChild} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {Store} from '@ngrx/store';
import {selectRouterParams} from '@common/core/reducers/router-reducer';
import {debounceTime, take} from 'rxjs/operators';
import {compareLimitations} from '@common/shared/entity-page/footer-items/compare-footer-item';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogRef, MatDialogTitle} from '@angular/material/dialog';
import {ITableExperiment} from '@common/experiments/shared/common-experiment-model.model';
import {isEqual, unionBy} from 'lodash-es';
import {ColHeaderTypeEnum, ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {addMessage} from '@common/core/actions/layout.actions';
import {INITIAL_EXPERIMENT_COLS_ORDER, INITIAL_EXPERIMENT_TABLE_COLS} from '@common/experiments/experiment.consts';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {ExperimentsTableComponent} from '@common/experiments/dumb/experiments-table/experiments-table.component';
import {MESSAGES_SEVERITY} from '@common/constants';
import {MatSlideToggle, MatSlideToggleChange} from '@angular/material/slide-toggle';
import {INITIAL_CONTROLLER_TABLE_COLS} from '@common/pipelines-controller/controllers.consts';
import {EXPERIMENTS_TABLE_COL_FIELDS} from '~/features/experiments/shared/experiments.const';
import {selectCurrentUser} from '@common/core/reducers/users-reducer';
import {ClearFiltersButtonComponent} from '@common/shared/components/clear-filters-button/clear-filters-button.component';
import {MatButton, MatIconButton} from '@angular/material/button';
import {IdToObjectsArrayPipe} from '@common/shared/pipes/idToObjectsArray.pipe';
import {FilterMetadata, SortMeta} from 'primeng/api';
import {Dispatcher} from '@ngrx/signals/events';
import {selectTaskEvents, selectTaskStore} from '@common/experiments-compare/containers/select-experiments-for-compare/select-task-store';
import {tableEvents} from '@common/experiments-compare/containers/select-experiments-for-compare/table-store';
import {NgTemplateOutlet} from '@angular/common';
import {MatIcon} from '@angular/material/icon';
import {viewEvents} from '@common/core/state/view.events';
import {SearchComponent} from '@common/shared/ui-components/inputs/search/search.component';


@Component({
  selector: 'sm-select-experiments-for-compare',
  templateUrl: './select-experiments-for-compare.component.html',
  styleUrls: ['./select-experiments-for-compare.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [selectTaskStore],
  imports: [
    MatSlideToggle,
    ExperimentsTableComponent,
    ClearFiltersButtonComponent,
    MatButton,
    IdToObjectsArrayPipe,
    SearchComponent,
    NgTemplateOutlet,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatIcon,
    MatIconButton
  ]
})
export class SelectExperimentsForCompareComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  readonly selectTaskStore = inject(selectTaskStore);
  readonly dispatcher = inject(Dispatcher);
  public dialogRef = inject(MatDialogRef<SelectExperimentsForCompareComponent>);
  protected data = inject<{ entityType: EntityTypeEnum, filters: Record<string, FilterMetadata>; sort: SortMeta[] }>(MAT_DIALOG_DATA);

  noMoreExperiments = this.selectTaskStore.noMoreExperiments;
  private filters: Record<string, FilterMetadata>;
  private sortableFields = ['started', 'last_update', 'active_duration'];
  public entityTypes = EntityTypeEnum;
  public selectedExperimentsIds = signal<string[]>([]);
  selectedExperiment: ITableExperiment;
  public reachedCompareLimit = signal(false);
  private _resizedCols = {} as Record<string, string>;
  private resizedCols = signal<Record<string, string>>(this._resizedCols);
  private loadMoreCount = 0;
  showArchived = this.selectTaskStore.viewArchived;
  selectedTasks = this.selectTaskStore.selectedExperiments;
  popupMode = !!this.data.entityType;
  public initTableCols = this.getInitTablesCols(this.data?.entityType ?? EntityTypeEnum.experiment);

  projectIdForce = input<string>();
  filtersForce = input<Record<string, FilterMetadata>>();
  sortFieldsForce = input<SortMeta[]>();
  taskId = input<string>();
  taskSelected = output<{ selectedTask: ITableExperiment; filters: Record<string, FilterMetadata>; sortFields: SortMeta[] }>();

  routerParams = this.store.selectSignal(selectRouterParams);
  taskIds = computed(() => this.taskId() || this.routerParams()['ids'] || undefined);
  projectId = computed(() => this.projectIdForce() ?? this.routerParams()['projectId']);
  protected currentUser = this.store.selectSignal(selectCurrentUser);


  experiments = computed(() => {
    const experimentsList = this.selectTaskStore.tasks();
    const selectedExperimentsList = this.selectedTasks();

    if (experimentsList === null) {
      return null;
    }

    if (!experimentsList || !selectedExperimentsList) {
      return [] as ITableExperiment[];
    }

    const union = unionBy(selectedExperimentsList, experimentsList, 'id');

    // Simple hack to show 'archived' tag.
    return union.map(e => ({
      ...e,
      system_tags: e.system_tags?.map(t => t.replace('archive', ' archive'))
    }) as ITableExperiment);
  });

  tableColsOrder = this.selectTaskStore.colsOrder;
  columns = this.selectTaskStore.columns;
  metricTableCols = this.selectTaskStore.metricsColsForProject();
  users = this.selectTaskStore.users;
  parents = this.selectTaskStore.parents;
  projects = this.selectTaskStore.projectsFilterOptions;
  tags = this.selectTaskStore.tags;
  types = this.selectTaskStore.types;
  hyperParamsOptions = this.selectTaskStore.hyperParamsOptions;
  activeParentsFilter = this.selectTaskStore.activeParentsFilter;
  tableSortFields = computed(() => this.selectTaskStore.projectColumnsSortOrder()[this.projectId()], {equal: (a, b) => isEqual(a, b)});
  tableFilters = computed(() => this.selectTaskStore.projectColumnFilters()[this.projectId()], {equal: (a, b) => isEqual(a, b)});
  tableColsTemp = computed(() => this.columns().concat(this.metricTableCols.map(col => ({...col, metric: true})))
    .map(col => ({
      ...col,
      style: {...col.style, width: this.resizedCols()[col.id] || col.style?.width}
    }))
  );
  tableCols = computed(() => this.tableColsTemp()
    .filter(col => (!col.hidden || col.id === 'project.name'))
    .map(col => ({
        ...col,
        hidden: false,
        headerType: col.headerType === ColHeaderTypeEnum.checkBox ? ColHeaderTypeEnum.title : col.headerType,
        ...(col.id === 'project.name' && {
          getter: 'project',
          filterable: true,
          searchableFilter: true,
          sortable: false,
          headerType: ColHeaderTypeEnum.sortFilter
        })
      })
    ), {equal: (a, b) => isEqual(a, b)});

  table = viewChild(ExperimentsTableComponent);

  protected searchTerm = signal<string>(null);
  protected debouncedSearchTerm = toSignal(toObservable(this.searchTerm).pipe(debounceTime(300)));
  protected readonly cardsCollapsed = signal<boolean>(true);


  constructor() {

    this.resizedCols.set(this._resizedCols);
    this.dialogRef.afterOpened()
      .pipe(take(1))
      .subscribe(() => this.table()?.table().resize());

    effect(() => {
      this.filters = this.filtersForce() ?? this.data?.filters;
      if (this.filters) {
        const filters = Object.keys(this.filters).map(col => ({col, value: this.filters[col].value, filterMatchMode: this.filters[col].matchMode}));
        if (this.projectId() !== '*') {
          filters.push({col: 'project.name', value: [this.projectId()], filterMatchMode: undefined});
        }
        this.dispatcher.dispatch(tableEvents.setTableFilters({projectId: this.projectId(), filters}));
      } else if (this.projectId() !== '*') {
        this.dispatcher.dispatch(tableEvents.setTableFilters({projectId: this.projectId(), filters: [{col: 'project.name', value: [this.projectId()], filterMatchMode: undefined}]}));
      }
    });

    effect(() => {
      const sortFields = this.sortFieldsForce() ?? this.data?.sort;
      if (sortFields) {
        this.dispatcher.dispatch(tableEvents.setTableSort({orders: sortFields, projectId: this.projectId()}));
      } else if (this.projectId() !== '*') {
        this.dispatcher.dispatch(tableEvents.setTableSort({orders: [...INITIAL_EXPERIMENT_COLS_ORDER], projectId: this.projectId()}));
      }
    });

    effect(() => {
      const projectId = this.projectId();
      const searchTerm = this.debouncedSearchTerm();
      const orderFields = this.tableSortFields();
      const filters = this.tableFilters();
      const cols = this.tableCols();
      const metricCols = this.selectTaskStore.metricsColsForProject();
      const showArchived = this.showArchived();

      this.dispatcher.dispatch(selectTaskEvents.getTasks({
        isLoadMore: false,
        isDataset: this.data?.entityType === EntityTypeEnum.dataset,
        isPipeline: this.data?.entityType === EntityTypeEnum.controller,
        projectId,
        searchTerm,
        orderFields,
        filters,
        cols,
        metricCols,
        showArchived
      }));
    });

    const initSelection = effect(() => {
      if (this.selectedExperimentsIds()?.length === 0) {
        this.selectedExperimentsIds.set(this.taskIds()?.split(',') ?? null);
        this.syncSelectedExperiments();
      }
      initSelection.destroy();
    });

    effect(() => {
      if (this.experiments()?.length > 0) {
        this.selectedExperiment = this.experiments().find(exp => exp.id === this.taskId() || exp.id === this.selectedExperiment?.id) ?? this.selectedExperiment;
      }
    });
  }

  ngOnDestroy(): void {
    this.dispatcher.dispatch(viewEvents.deactivateLoader({endpoint: 'select task'}));
  }

  public searchTermChanged(term: string) {
    this.searchTerm.set(term);
  }

  public syncSelectedExperiments() {
    if (this.selectedExperimentsIds() && this.selectedTasks()?.length === 0 && this.popupMode) {
      this.dispatcher.dispatch(selectTaskEvents.getSelectedExperimentsForCompareAddDialog({tasksIds: this.selectedExperimentsIds()}));
    }
  }

  syncAppSearch() {
  }

  refreshTagsList() {
    this.dispatcher.dispatch(tableEvents.getTags({allProjects: true}));
  }

  refreshTypesList() {
    this.dispatcher.dispatch(selectTaskEvents.getProjectTypes());
  }


  ngOnInit() {
    this.dispatcher.dispatch(tableEvents.setTableCols({cols: this.initTableCols}));
    window.setTimeout(() => this.table().table().rowRightClick = new EventEmitter());

    this.dispatcher.dispatch(tableEvents.getTags({allProjects: true}));
    this.dispatcher.dispatch(selectTaskEvents.getProjectTypes());
    this.dispatcher.dispatch(selectTaskEvents.getFilterProjectsOptions({searchString: '', loadMore: false}));
    this.dispatcher.dispatch(tableEvents.getParents({searchValue: null, allProjects: true}));
    this.dispatcher.dispatch(selectTaskEvents.getUsers());
  }


  experimentsSelectionChanged(experiments: ITableExperiment[]) {
    this.reachedCompareLimit.set(experiments.length >= compareLimitations);
    if (experiments.length === 0) {
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.WARN, 'Compare module should include at least one experiment'));
      this.selectedExperimentsIds.set(experiments.map(ex => ex.id));
      return;
    }
    if (experiments.length > 0 && experiments.length <= compareLimitations) {
      if (!this.popupMode) {
        this.selectedExperiment = this.experiments().find(exp => exp.id === experiments[0].id);
        this.selectedExperimentsIds.set([experiments.at(-1)?.id]);

      } else {
        this.selectedExperimentsIds.set(experiments.map(ex => ex.id));
      }
    } else {
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.WARN, compareLimitations + ' or fewer experiments can be compared'));
    }
  }

  getNextExperiments() {
    this.loadMoreCount++;
    this.syncSelectedExperiments();
    this.dispatcher.dispatch(selectTaskEvents.getTasks({
      isLoadMore: true,
      isDataset: this.data?.entityType === EntityTypeEnum.dataset,
      isPipeline: this.data?.entityType === EntityTypeEnum.controller,
      projectId: this.projectId(),
      searchTerm: this.searchTerm(),
      orderFields: this.tableSortFields(),
      filters: this.tableFilters(),
      cols: this.tableCols(),
      metricCols: this.selectTaskStore.metricsColsForProject(),
      showArchived: this.showArchived()
    }));
  }

  sortedChanged(event: { isShift: boolean; colId: ISmCol['id'] }) {
    this.syncSelectedExperiments();
    this.dispatcher.dispatch(selectTaskEvents.compareAddDialogTableSortChanged({
      sort: event,
      projectId: this.projectId()
    }));
  }

  filterChanged({col, value, andFilter}: { col: ISmCol; value: unknown; andFilter?: boolean }) {

    this.syncSelectedExperiments();
    this.dispatcher.dispatch(selectTaskEvents.compareAddTableFilterChanged({
      filter: {
        col: col.id,
        value,
        filterMatchMode: col.filterMatchMode || andFilter ? 'AND' : undefined
      },
      projectId: this.projectId()
    }));
  }

  clearTableFilters(clearSearch: boolean) {
    this.dispatcher.dispatch(tableEvents.tableClearAllFilters({projectId: this.projectId()}));
    if (clearSearch) {
      this.searchTerm.set(null);
    }
  }

  closeDialog(confirm: boolean) {
    this.taskSelected.emit({selectedTask: confirm && this.selectedExperiment, filters: this.tableFilters(), sortFields: this.tableSortFields()});
  }

  resizeCol({columnId, widthPx}: { columnId: string; widthPx: number }) {
    this._resizedCols[columnId] = `${widthPx}px`;
    this.resizedCols.set(this._resizedCols);
  }

  toShowArchived(event: MatSlideToggleChange) {
    this.dispatcher.dispatch(selectTaskEvents.setAddTableViewArchived({show: event.checked}));
  }

  filterSearchChanged({colId, value}: { colId: string; value: { value: string; loadMore?: boolean } }) {
    switch (colId) {
      case 'project.name':
        if (this.projectId() === '*' && !value.loadMore) {
          this.dispatcher.dispatch(selectTaskEvents.compareAddTableFilterChanged({projectId: this.projectId(), filter: {...this.selectTaskStore.projectColumnFilters[this.projectId()], ['project.name']: {value: [this.projectId()], matchMode: undefined}}}));
          this.dispatcher.dispatch(tableEvents.setProjectsOptions({projects: [], projectsFilterOptionsScrillId: null}));
        }
        //need to pass selector
        this.dispatcher.dispatch(selectTaskEvents.getFilterProjectsOptions({searchString: value.value || '', loadMore: value.loadMore}));
        break;
      case 'parent.name':
        if (value.loadMore) {
          this.dispatcher.dispatch(tableEvents.setParents({parents: [...this.parents()]}));
        } else {
          this.dispatcher.dispatch(tableEvents.getParents({searchValue: value.value || '', allProjects: true}));
        }
    }
    if (colId.startsWith('hyperparams.')) {
      if (!value.loadMore) {
        this.dispatcher.dispatch(selectTaskEvents.hyperParamSelectedInfoExperiments({col: {id: colId}, loadMore: false, values: null}));
      }
      this.dispatcher.dispatch(selectTaskEvents.hyperParamSelectedExperiments({col: {id: colId, getter: `${colId}.value`}, searchValue: value.value || ''}));
    }
  }

  private getInitTablesCols(entityType: EntityTypeEnum) {
    switch (entityType) {
      case this.entityTypes.controller:
        return INITIAL_CONTROLLER_TABLE_COLS.map((col) =>
          col.id === EXPERIMENTS_TABLE_COL_FIELDS.NAME ? {...col, header: 'RUN'} : col);
      case this.entityTypes.dataset:
        return INITIAL_CONTROLLER_TABLE_COLS.map((col) =>
          col.id === EXPERIMENTS_TABLE_COL_FIELDS.NAME ? {...col, header: 'VERSION NAME'} : col);
      default:
        return this.popupMode ? INITIAL_EXPERIMENT_TABLE_COLS : INITIAL_EXPERIMENT_TABLE_COLS.map(col => this.sortableFields.includes(col.id) ? col : {...col, sortable: false});
    }
  }
}
