import {ChangeDetectorRef, Component, EventEmitter, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {compareAddDialogTableSortChanged, compareAddTableClearAllFilters, compareAddTableFilterChanged, compareAddTableFilterInit, getSelectedExperimentsForCompareAddDialog, resetSelectCompareHeader, setAddTableViewArchived, setShowSearchExperimentsForCompare} from '../../actions/compare-header.actions';
import {selectExperimentsForCompareSearchTerm, selectSelectedExperimentsForCompareAdd, selectViewArchivedInAddTable} from '../../reducers';
import {BehaviorSubject, combineLatest, Observable, Subscription} from 'rxjs';
import {Task} from '~/business-logic/model/tasks/task';
import {Params} from '@angular/router';
import {selectRouterParams} from '@common/core/reducers/router-reducer';
import {distinctUntilChanged, distinctUntilKeyChanged, filter, map, take, tap} from 'rxjs/operators';
import {compareLimitations} from '@common/shared/entity-page/footer-items/compare-footer-item';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ITableExperiment} from '@common/experiments/shared/common-experiment-model.model';
import {selectActiveParentsFilter, selectExperimentsList, selectExperimentsMetricsColsForProject, selectExperimentsParents, selectExperimentsTableCols, selectExperimentsTableColsOrder, selectExperimentsTags, selectExperimentsTypes, selectHyperParamsOptions, selectNoMoreExperiments, selectTableFilters, selectTableSortFields} from '@common/experiments/reducers';
import {isEqual, unionBy} from 'lodash-es';
import {ColHeaderTypeEnum, ISmCol, TableSortOrderEnum} from '@common/shared/ui-components/data/table/table.consts';
import {initSearch} from '@common/common-search/common-search.actions';
import * as experimentsActions from '../../../experiments/actions/common-experiments-view.actions';
import {hyperParamSelectedExperiments, hyperParamSelectedInfoExperiments, resetExperiments, resetGlobalFilter, setHyperParamsFiltersPage, setParents, setTableCols} from '@common/experiments/actions/common-experiments-view.actions';
import {User} from '~/business-logic/model/users/user';
import {selectProjectSystemTags, selectProjectUsers, selectTablesFilterProjectsOptions} from '@common/core/reducers/projects.reducer';
import {FilterMetadata, SortMeta} from 'primeng/api';
import {Project} from '~/business-logic/model/projects/project';
import {addMessage} from '@common/core/actions/layout.actions';
import {ProjectsGetTaskParentsResponseParents} from '~/business-logic/model/projects/projectsGetTaskParentsResponseParents';
import {INITIAL_EXPERIMENT_TABLE_COLS} from '@common/experiments/experiment.consts';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {ExperimentsTableComponent} from '@common/experiments/dumb/experiments-table/experiments-table.component';
import {MESSAGES_SEVERITY} from '@common/constants';
import {MatSlideToggle, MatSlideToggleChange} from '@angular/material/slide-toggle';
import {getProjectUsers, getTablesFilterProjectsOptions, resetTablesFilterProjectsOptions} from '@common/core/actions/projects.actions';
import {EXPERIMENTS_PAGE_SIZE} from '@common/experiments/shared/common-experiments.const';
import {INITIAL_CONTROLLER_TABLE_COLS} from '@common/pipelines-controller/controllers.consts';
import {EXPERIMENTS_TABLE_COL_FIELDS} from '~/features/experiments/shared/experiments.const';
import {selectCurrentUser} from '@common/core/reducers/users-reducer';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {ClearFiltersButtonComponent} from '@common/shared/components/clear-filters-button/clear-filters-button.component';
import {MatButton} from '@angular/material/button';
import {IdToObjectsArrayPipe} from '@common/shared/pipes/idToObjectsArray.pipe';
import {PushPipe} from '@ngrx/component';
import {SearchComponent} from '@common/shared/ui-components/inputs/search/search.component';

export const allowAddExperiment$ = (selectRouterParams$: Observable<Params>) => selectRouterParams$.pipe(
  distinctUntilKeyChanged('ids'),
  map(res => res.ids),
  distinctUntilChanged(),
  map(res => res.split(',').length < compareLimitations)
);


@Component({
  selector: 'sm-select-experiments-for-compare',
  templateUrl: './select-experiments-for-compare.component.html',
  styleUrls: ['./select-experiments-for-compare.component.scss'],
  imports: [
    MatSlideToggle,
    ExperimentsTableComponent,
    DialogTemplateComponent,
    ClearFiltersButtonComponent,
    MatButton,
    IdToObjectsArrayPipe,
    PushPipe,
    SearchComponent
  ]
})
export class SelectExperimentsForCompareComponent implements OnInit, OnDestroy {
  public entityTypes = EntityTypeEnum;
  public initTableCols = this.getInitTablesCols(this.data.entityType);
  public experimentsResults$: Observable<Task[]>;
  public selectedExperimentsIds: string[] = [];
  private paramsSubscription: Subscription;
  public searchTerm$: Observable<string>;
  searchTerm = this.store.selectSignal(selectExperimentsForCompareSearchTerm);
  public allowAddExperiment$: Observable<boolean>;
  public tableColsOrder$: Observable<string[]>;
  public tableSortOrder$: Observable<TableSortOrderEnum>;
  private columns$: Observable<ISmCol[] | undefined>;
  private metricTableCols$: Observable<ISmCol[]>;
  public tableCols$: Observable<ISmCol[]>;
  public experiments$: Observable<ITableExperiment[]>;
  private projectId: string;
  public users$: Observable<User[]>;
  public tableFilters$: Observable<Record<string, FilterMetadata>>;
  public tags$: Observable<string[]>;
  public systemTags$: Observable<string[]>;
  public types$: Observable<string[]>;
  public noMoreExperiments$: Observable<boolean>;
  public hyperParamsOptions$: Observable<Record<string, string[]>>;
  public activeParentsFilter$: Observable<ProjectsGetTaskParentsResponseParents[]>;
  public parent$: Observable<ProjectsGetTaskParentsResponseParents[]>;
  public tableSortFields$: Observable<SortMeta[]>;
  public projects$: Observable<Project[]>;
  selectedExperiment: ITableExperiment;
  public reachedCompareLimit: boolean;
  public showArchived$: Observable<boolean>;
  private _resizedCols = {} as Record<string, string>;
  private resizedCols$ = new BehaviorSubject<Record<string, string>>(this._resizedCols);
  private loadMoreCount = 0;
  @ViewChild('searchExperiments', {static: true}) searchExperiments;
  @ViewChild(ExperimentsTableComponent) table: ExperimentsTableComponent;
  private parents: ProjectsGetTaskParentsResponseParents[];
  private timer: number;
  private previousExperimentsLength: number;
  protected currentUser = this.store.selectSignal(selectCurrentUser);

  constructor(
    private store: Store,
    private changedDetectRef: ChangeDetectorRef,
    public dialogRef: MatDialogRef<SelectExperimentsForCompareComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { entityType: EntityTypeEnum }
  ) {
    this.resizedCols$.next(this._resizedCols);
    this.experimentsResults$ = this.store.select(selectSelectedExperimentsForCompareAdd);
    this.showArchived$ = this.store.select(selectViewArchivedInAddTable);
    this.experiments$ = combineLatest([
      this.store.select(selectExperimentsList),
      this.store.select(selectSelectedExperimentsForCompareAdd),
    ]).pipe(
      filter(([experiments, selectedExperiments]) => experiments !== null && selectedExperiments !== null),
      map(([experiments, selectedExperiments]) => {
        const union = unionBy(selectedExperiments, experiments, 'id');
        if (this.previousExperimentsLength !== experiments?.length && experiments?.length >= EXPERIMENTS_PAGE_SIZE && (union.length - (selectedExperiments?.length ?? 0) < EXPERIMENTS_PAGE_SIZE * (this.loadMoreCount + 1))) {
          this.store.dispatch(experimentsActions.getNextExperiments());
          this.previousExperimentsLength = experiments?.length;
        }
        // Simple hack to show 'archived' tag in select experiment table (without the table knows)
        return union.map(e => ({...e, system_tags: e.system_tags?.map((t => t.replace('archive', ' archive')))}));
      })
    );
    this.searchTerm$ = this.store.select(selectExperimentsForCompareSearchTerm);
    this.tableColsOrder$ = this.store.select(selectExperimentsTableColsOrder);
    this.columns$ = this.store.select(selectExperimentsTableCols);
    this.metricTableCols$ = this.store.select(selectExperimentsMetricsColsForProject);
    this.users$ = this.store.select(selectProjectUsers);
    this.tableFilters$ = this.store.select(selectTableFilters);
    this.parent$ = this.store.select(selectExperimentsParents).pipe(tap(parents => this.parents = parents));
    this.projects$ = this.store.select(selectTablesFilterProjectsOptions);


    this.tags$ = this.store.select(selectExperimentsTags);
    this.types$ = this.store.select(selectExperimentsTypes);
    this.systemTags$ = this.store.select(selectProjectSystemTags);
    this.noMoreExperiments$ = this.store.select(selectNoMoreExperiments);
    this.tableSortFields$ = this.store.select(selectTableSortFields);
    this.hyperParamsOptions$ = this.store.select(selectHyperParamsOptions);
    this.activeParentsFilter$ = this.store.select(selectActiveParentsFilter);
    this.tableCols$ = combineLatest([this.columns$, this.metricTableCols$, this.resizedCols$])
      .pipe(
        map(([tableCols, metricCols, resizedCols]) =>
          tableCols.concat(metricCols.map(col => ({...col, metric: true})))
            .map(col => ({
              ...col,
              style: {...col.style, width: resizedCols[col.id] || col.style?.width}
            }))
        ),
        distinctUntilChanged((a, b) => isEqual(a, b)),
        map(cols => cols.filter(col => (!col.hidden || col.id === 'project.name')).map(col => ({
            ...col,
            hidden: false,
            headerType: col.headerType === ColHeaderTypeEnum.checkBox ? ColHeaderTypeEnum.title : col.headerType,
            ...(col.id === 'project.name' && {
              getter: 'project',
              filterable: true,
              searchableFilter: true,
              sortable: false,
              headerType: ColHeaderTypeEnum.sortFilter,
            }),
          })
        )));
    this.dialogRef.afterOpened()
      .pipe(take(1))
      .subscribe(() => this.table.table().resize());
  }

  public searchTermChanged(term: string) {
    this.previousExperimentsLength = null;
    clearTimeout(this.timer);
    this.timer = window.setTimeout( () => this.store.dispatch(experimentsActions.globalFilterChanged({query: term})), 300);
  }

  public closeSearch() {
    this.store.dispatch(setShowSearchExperimentsForCompare({payload: false}));
  }

  public syncSelectedExperiments() {
    if (this.selectedExperimentsIds) {
      this.store.dispatch(getSelectedExperimentsForCompareAddDialog({tasksIds: this.selectedExperimentsIds}));
    }
  }

  syncAppSearch() {
    this.store.dispatch(initSearch({payload: 'Search for experiments'}));
    this.store.dispatch(experimentsActions.getExperiments());
  }

  refreshTagsList() {
    this.store.dispatch(experimentsActions.getTags({allProjects: true}));
  }

  refreshTypesList() {
    this.store.dispatch(experimentsActions.getProjectTypes({allProjects: true}));
  }


  ngOnInit() {
    this.previousExperimentsLength = null;
    this.store.dispatch(setTableCols({cols: this.initTableCols}));
    this.store.dispatch(setShowSearchExperimentsForCompare({payload: true}));
    this.store.dispatch(getProjectUsers({projectId: '*'}));
    window.setTimeout(() => this.table.table().rowRightClick = new EventEmitter());
    this.paramsSubscription = this.store.select(selectRouterParams)
      .pipe(
        map(params => [params && params['ids'], params?.projectId]),
        filter(([experimentIds,]) => !!experimentIds),
      )
      .subscribe(([experimentIds, projectId]) => {
      if (this.selectedExperimentsIds.length === 0) {
        this.selectedExperimentsIds = experimentIds.split(',');
        this.syncSelectedExperiments();
      }
      if (!this.projectId && projectId !== '*') {
        this.store.dispatch(compareAddTableFilterInit({projectId}));
      }
      this.projectId = projectId;
      this.changedDetectRef.detectChanges();
    });
    this.allowAddExperiment$ = allowAddExperiment$(this.store.select(selectRouterParams));
    this.store.dispatch(experimentsActions.getTags({allProjects: true}));
    this.store.dispatch(experimentsActions.getProjectTypes({allProjects: true}));
    this.store.dispatch(experimentsActions.getParents({searchValue: null, allProjects: true}));
    this.store.dispatch(getSelectedExperimentsForCompareAddDialog(null));
    this.syncAppSearch();
  }

  ngOnDestroy(): void {
    this.paramsSubscription.unsubscribe();
    this.store.dispatch(setShowSearchExperimentsForCompare({payload: false}));
    this.store.dispatch(resetExperiments({skipResetMetric: true}));
    this.store.dispatch(resetGlobalFilter());
    this.store.dispatch(resetSelectCompareHeader({fullReset: false}));
  }


  experimentsSelectionChanged(experiments: ITableExperiment[]) {
    this.reachedCompareLimit = experiments.length >= compareLimitations;
    if (experiments.length === 0) {
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.WARN, 'Compare module should include at least one experiment'));
      this.selectedExperimentsIds = experiments.map(ex => ex.id);
      return;
    }
    if (experiments.length <= compareLimitations) {
      this.selectedExperimentsIds = experiments.map(ex => ex.id);
    } else {
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.WARN, compareLimitations + ' or fewer experiments can be compared'));
    }
  }

  getNextExperiments() {
    this.loadMoreCount++;
    this.syncSelectedExperiments();
    this.store.dispatch(experimentsActions.getNextExperiments());
  }

  sortedChanged(event: { isShift: boolean; colId: ISmCol['id'] }) {
    this.previousExperimentsLength = null;
    this.syncSelectedExperiments();
    this.store.dispatch(compareAddDialogTableSortChanged(event));
  }

  filterChanged({col, value, andFilter}: { col: ISmCol; value: unknown; andFilter?: boolean }) {
    this.previousExperimentsLength = null;
    this.syncSelectedExperiments();
    this.store.dispatch(compareAddTableFilterChanged({
      filter: {
        col: col.id,
        value,
        filterMatchMode: col.filterMatchMode || andFilter ? 'AND' : undefined
      }, projectId: this.projectId
    }));
  }

  clearTableFilters() {
    this.store.dispatch(compareAddTableClearAllFilters({projectId: this.projectId}));
  }

  applyChanges() {
    this.closeDialog(this.selectedExperimentsIds);
  }

  closeDialog(experimentIds?: string[]) {
    this.dialogRef.close(experimentIds);
  }

  resizeCol({columnId, widthPx}: { columnId: string; widthPx: number }) {
    this._resizedCols[columnId] = `${widthPx}px`;
    this.resizedCols$.next(this._resizedCols);
  }

  showArchived(event: MatSlideToggleChange) {
    this.previousExperimentsLength = null;
    this.store.dispatch(setAddTableViewArchived({show: event.checked}));
  }

  filterSearchChanged({colId, value}: { colId: string; value: { value: string; loadMore?: boolean } }) {
    this.previousExperimentsLength = null;
    switch (colId) {
      case 'project.name':
        if (this.projectId === '*' && !value.loadMore) {
          this.store.dispatch(resetTablesFilterProjectsOptions());
        }
        this.store.dispatch(getTablesFilterProjectsOptions({searchString: value.value || '', loadMore: value.loadMore}));
        break;
      case 'parent.name':
        if (value.loadMore) {
          this.store.dispatch(setParents({parents: [...this.parents]}));
        } else {
          this.store.dispatch(experimentsActions.resetTablesFilterParentsOptions());
          this.store.dispatch(experimentsActions.getParents({searchValue: value.value || '', allProjects: true}));
        }
    }
    if (colId.startsWith('hyperparams.')) {
      if (!value.loadMore) {
        this.store.dispatch(hyperParamSelectedInfoExperiments({col: {id: colId}, loadMore: false, values: null}));
        this.store.dispatch(setHyperParamsFiltersPage({page: 0}));
      }
      this.store.dispatch(hyperParamSelectedExperiments({col: {id: colId, getter: `${colId}.value`}, searchValue: value.value || ''}));
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
        return INITIAL_EXPERIMENT_TABLE_COLS;
    }
  }
}
