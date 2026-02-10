import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  OnDestroy,
  signal,
  viewChild
} from '@angular/core';
import {
  selectActiveParentsFilter,
  selectCompareSelectedMetrics,
  selectCustomColumns,
  selectExperimentsList,
  selectExperimentsParents,
  selectExperimentsTableColsOrder,
  selectExperimentsTags,
  selectExperimentsTypes,
  selectFilteredTableCols,
  selectHyperParamsOptions,
  selectHyperParamsVariants,
  selectIsExperimentInEditMode,
  selectMetricVariantForView,
  selectMetricVariants,
  selectNoMoreExperiments,
  selectSelectedExperiments,
  selectSelectedExperimentsDisableAvailable,
  selectSelectedTableExperiment,
  selectShowAllSelectedIsActive,
  selectShowCompareScalarSettings,
  selectSplitSize,
  selectTableCompareView,
  selectTableFilters,
  selectTableMode,
  selectTableRefreshList,
  selectTableSortFields
} from './reducers';
import {
  selectCompanyTags,
  selectProjectSystemTags,
  selectRouterProjectId,
  selectSelectedProjectId,
  selectTagsFilterByProject
} from '../core/reducers/projects.reducer';
import {ColHeaderTypeEnum, ISmCol, TableSortOrderEnum} from '../shared/ui-components/data/table/table.consts';
import {isEqual} from 'lodash-es';
import {selectRouterParams} from '../core/reducers/router-reducer';
import {debounceTime, distinctUntilChanged, filter, map, skip, switchMap, tap} from 'rxjs/operators';
import {combineLatest, Observable} from 'rxjs';
import {selectBackdropActive} from '../core/reducers/view.reducer';
import {initSearch, resetSearch} from '../common-search/common-search.actions';
import {selectSearchQuery} from '../common-search/common-search.reducer';
import {ITableExperiment} from './shared/common-experiment-model.model';
import * as experimentsActions from './actions/common-experiments-view.actions';
import {resetAceCaretsPositions, setAutoRefresh} from '../core/actions/layout.actions';
import {
  getProjectUsers,
  setArchive as setProjectArchive,
  setBreadcrumbsOptions,
  setDeep
} from '../core/actions/projects.actions';
import {
  createCompareMetricColumn,
  createMetricColumn,
  decodeColumns,
  decodeFilter,
  decodeOrder,
  decodeURIComponentSafe
} from '../shared/utils/tableParamEncode';
import {BaseEntityPageComponent} from '../shared/entity-page/base-entity-page';
import {groupHyperParams} from '../shared/utils/shared-utils';
import {
  ProjectsGetTaskParentsResponseParents
} from '~/business-logic/model/projects/projectsGetTaskParentsResponseParents';
import {FilterMetadata, SortMeta} from 'primeng/api';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {ShowItemsFooterSelected} from '../shared/entity-page/footer-items/show-items-footer-selected';
import {CompareFooterItem} from '../shared/entity-page/footer-items/compare-footer-item';
import {DividerFooterItem} from '../shared/entity-page/footer-items/divider-footer-item';
import {ArchiveFooterItem} from '../shared/entity-page/footer-items/archive-footer-item';
import {SelectedTagsFooterItem} from '../shared/entity-page/footer-items/selected-tags-footer-item';
import {DeleteFooterItem} from '../shared/entity-page/footer-items/delete-footer-item';
import {ResetFooterItem} from '../shared/entity-page/footer-items/reset-footer-item';
import {PublishFooterItem} from '../shared/entity-page/footer-items/publish-footer-item';
import {MoveToFooterItem} from '../shared/entity-page/footer-items/move-to-footer-item';
import {EnqueueFooterItem} from '../shared/entity-page/footer-items/enqueue-footer-item';
import {AbortFooterItem} from '../shared/entity-page/footer-items/abort-footer-item';
import {addTag} from './actions/common-experiments-menu.actions';
import {
  CountAvailableAndIsDisableSelectedFiltered,
  MenuItems,
  selectionDisabledAbort,
  selectionDisabledAbortAllChildren,
  selectionDisabledArchive,
  selectionDisabledDelete,
  selectionDisabledDequeue,
  selectionDisabledEnqueue,
  selectionDisabledMoveTo,
  selectionDisabledPipelineRun,
  selectionDisabledPublishExperiments,
  selectionDisabledQueue,
  selectionDisabledReset,
  selectionDisabledRetry,
  selectionDisabledViewWorker
} from '../shared/entity-page/items.utils';
import {ExperimentsTableComponent} from './dumb/experiments-table/experiments-table.component';
import {DequeueFooterItem} from '../shared/entity-page/footer-items/dequeue-footer-item';
import {HasReadOnlyFooterItem} from '../shared/entity-page/footer-items/has-read-only-footer-item';
import {encodeHyperParameter, filterArchivedExperiments} from './shared/common-experiments.utils';
import {AbortAllChildrenFooterItem} from '../shared/entity-page/footer-items/abort-all-footer-item';
import {
  ExperimentMenuExtendedComponent
} from '~/features/experiments/containers/experiment-menu-extended/experiment-menu-extended.component';
import {INITIAL_EXPERIMENT_TABLE_COLS} from './experiment.consts';
import {selectIsPipelines} from '@common/experiments-compare/reducers';
import {isReadOnly} from '@common/shared/utils/is-read-only';
import {rootProjectsPageSize} from '@common/constants';
import {
  SelectionEvent
} from '@common/experiments/dumb/select-metric-for-custom-col/select-metric-for-custom-col.component';
import {
  CreateExperimentDialogComponent
} from '@common/experiments/containers/create-experiment-dialog/create-experiment-dialog.component';
import {RetryFooterItem} from '@common/shared/entity-page/footer-items/retry-footer-item';
import {computedPrevious} from 'ngxtension/computed-previous';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {setExperiment} from '@common/experiments/actions/common-experiments-info.actions';
import {selectMetricsLoading, selectSelectedExperiment} from '~/features/experiments/reducers';
import {ProjectsGetUserNamesRequest} from '~/business-logic/model/projects/projectsGetUserNamesRequest';
import {distinctParamsUntilChanged$} from '@common/projects/common-projects.utils';
import {SplitAreaComponent, SplitComponent} from 'angular-split';
import {RouterOutlet} from '@angular/router';
import {OverlayComponent} from '@common/shared/ui-components/overlay/overlay/overlay.component';
import {ExperimentHeaderComponent} from '@common/experiments/dumb/experiment-header/experiment-header.component';
import {EntityFooterComponent} from '@common/shared/entity-page/entity-footer/entity-footer.component';
import {PushPipe} from '@ngrx/component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {concatLatestFrom} from '@ngrx/operators';


@Component({
  selector: 'sm-common-experiments',
  templateUrl: './experiments.component.html',
  styleUrls: ['./experiments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SplitComponent,
    SplitAreaComponent,
    RouterOutlet,
    ExperimentsTableComponent,
    ExperimentMenuExtendedComponent,
    OverlayComponent,
    ExperimentHeaderComponent,
    EntityFooterComponent,
    MatIconModule,
    PushPipe,
    TooltipDirective,
    MatButton
  ]
})
export class ExperimentsComponent extends BaseEntityPageComponent implements OnDestroy {
  protected get tableCols() {
    return INITIAL_EXPERIMENT_TABLE_COLS;
  }

  public entityTypeEnum = EntityTypeEnum;
  public tableSortOrder$: Observable<TableSortOrderEnum>;
  public readOnlySelection: boolean;
  public contextMenuActive: boolean;
  public singleRowContext: boolean;
  public firstExperiment: ITableExperiment;
  public menuBackdrop: boolean;
  protected setTableModeAction = experimentsActions.setTableMode;
  private sortFields: SortMeta[];
  protected override parents: ProjectsGetTaskParentsResponseParents[];

  protected override splitSize = this.store.selectSignal(selectSplitSize);
  protected override showAllSelectedIsActive$ = this.store.select(selectShowAllSelectedIsActive);

  protected isPipeline$ = this.store.select(selectIsPipelines);
  protected tableSortFields$ = this.store.select(selectTableSortFields).pipe(tap(field => this.sortFields = field));
  protected backdropActive$ = this.store.select(selectBackdropActive);
  protected noMoreExperiments$ = this.store.select(selectNoMoreExperiments);
  protected tableFilters$ = this.store.select(selectTableFilters);
  protected selectedExperimentsDisableAvailable$ = this.store.select(selectSelectedExperimentsDisableAvailable);
  protected selectedExperimentsHasUpdate$ = this.store.select(selectTableRefreshList);
  protected checkedExperiments$ = this.store.select(selectSelectedExperiments)
    .pipe(tap((selectedExperiments: ITableExperiment[]) => {
      this.checkedExperiments = selectedExperiments;
      this.readOnlySelection = this.checkedExperiments.some(exp => isReadOnly(exp));
    }));
  protected searchQuery$ = this.store.select(selectSearchQuery);
  protected parents$ = this.store.select(selectExperimentsParents).pipe(tap(parents => this.parents = parents));
  protected activeParentsFilter$ = this.store.select(selectActiveParentsFilter);
  protected types$ = this.store.select(selectExperimentsTypes);
  protected tags$ = this.store.select(selectExperimentsTags);
  protected tagsFilterByProject$ = this.store.select(selectTagsFilterByProject);
  protected companyTags$ = this.store.select(selectCompanyTags);
  protected systemTags$ = this.store.select(selectProjectSystemTags);
  protected tableColsOrder$ = this.store.select(selectExperimentsTableColsOrder);
  protected metricVariants$ = this.store.select(selectMetricVariants);
  protected metricLoading$ = this.store.select(selectMetricsLoading);
  protected hyperParamsOptions$ = this.store.select(selectHyperParamsOptions);
  protected hyperParams$ = this.store.select(selectHyperParamsVariants).pipe(
    map(hyperParams => groupHyperParams(hyperParams.filter(hp => hp.section !== 'properties' || hp.name !== 'version')))
  );

  protected experiments$ = combineLatest([
    this.store.select(selectExperimentsList)
  ])
    .pipe(
      filter(([experiments, ]) => experiments !== null),
      // lil hack for hiding archived task after they have been archived from task info or footer...
      map(([experiments, ]) => filterArchivedExperiments(experiments, this.inArchivedMode()))
    );

  protected filteredTableCols$ = this.store.select(selectFilteredTableCols);


  protected tableCols$ = this.filteredTableCols$.pipe(
    distinctUntilChanged((a, b) => isEqual(a, b)),
    map(cols => cols.filter(col => !col.hidden))
  );
  override tableMode = this.store.selectSignal(selectTableMode);
  // .pipe(tap(tableMode => this.tableMode = tableMode));
  protected showCompareScalarSettings$ = this.store.select(selectShowCompareScalarSettings);
  protected compareSelectedMetricsScalars$ = this.store.select(selectCompareSelectedMetrics('scalars'));
  protected compareSelectedMetricsPlots$ = this.store.select(selectCompareSelectedMetrics('plots'));
  protected selectedExperiment$ = this.store.select(selectSelectedExperiment);
  protected selectedTableExperiment = toSignal(this.store.select(selectSelectedTableExperiment)
    .pipe(distinctUntilChanged((a, b) => a?.id === b?.id)));
  private previousTableExperiment = computedPrevious(this.selectedTableExperiment);
  protected selectionState = computed(() => ({
    prevExperiment: this.previousTableExperiment(),
    highlited: signal(this.selectedTableExperiment() ?? this.previousTableExperiment())
  }));
  protected highlited = computed(() => this.tableMode() === 'compare' ? null : this.selectionState().highlited());


  table = viewChild(ExperimentsTableComponent);
  contextMenuExtended = viewChild.required(ExperimentMenuExtendedComponent);
  public contextMenu = computed(() => this.contextMenuExtended().contextMenu());

  // public tableMode: 'table' | 'info' | 'compare';
  private previousSelectedIds: string;
  public metricsVariants$ = this.store.selectSignal(selectMetricVariantForView);
  public tableCompareView = this.store.selectSignal(selectTableCompareView);

  protected showColorsInCards = computed(() => {
    return this.tableMode() === 'compare';
  });


  override get selectEditMode() {
    return selectIsExperimentInEditMode;
  }

  protected override get entityType() {
    return EntityTypeEnum.experiment;
  }

  constructor() {
    super();
    this.setSplitSizeAction = experimentsActions.setSplitSize;
    this.addTag = addTag;
    this.syncAppSearch();

    this.store.dispatch(getProjectUsers({
      projectId: this.selectedProjectId,
      entity: ProjectsGetUserNamesRequest.EntityEnum.Task
    }));
    this.store.dispatch(experimentsActions.setTableCols({cols: this.tableCols}));

    // effect(() => {
    //   this.shouldOpenDetails = this.tableMode() !== 'table';
    // });

    this.store.select(selectRouterParams)
      .pipe(
        takeUntilDestroyed(),
        map(params => this.getParamId(params)))
      .subscribe(() =>
        this.store.dispatch(resetAceCaretsPositions()));

    distinctParamsUntilChanged$(combineLatest([
      this.store.select(selectRouterProjectId),
      this.route.queryParams,
      this.store.select(selectCustomColumns)
    ]))
      .subscribe(([prevProjectId, projectId, params]) => {
        if (projectId !== prevProjectId && Object.keys(params || {}).length === 0) {
          this.emptyUrlInit();
        } else {
          if (this.entityType === this.entityTypeEnum.experiment) {
            this.setupContextMenu('tasks', params.archive === 'true');
          }
          if (params.columns) {
            const [cols, metrics, hyperParams, , allIds] = decodeColumns(params.columns, this.tableCols);
            this.store.dispatch(experimentsActions.setVisibleColumnsForProject({
              visibleColumns: cols,
              projectId: this.projectId()
            }));
            this.store.dispatch(experimentsActions.setExtraColumns({
              projectId: this.selectedProjectId,
              columns: metrics.map(metricCol => createMetricColumn(metricCol, projectId))
                .concat(hyperParams.map(param => this.createParamColumn(decodeURIComponentSafe(param), projectId)))
            }));
            this.columnsReordered(allIds, false);
          }
          if (params.order) {
            const orders = decodeOrder(params.order);
            this.store.dispatch(experimentsActions.setTableSort({orders, projectId}));
          }
          if (params.filter != null) {
            const filters = decodeFilter(params.filter);
            this.store.dispatch(experimentsActions.setTableFilters({filters, projectId: this.selectedProjectId}));
          } else {
            if (params.order) {
              this.store.dispatch(experimentsActions.setTableFilters({filters: [], projectId}));
            }
          }
          if (params.deep) {
            this.store.dispatch(setDeep({deep: true}));
          }
          this.store.dispatch(setProjectArchive({archive: params.archive === 'true'}));
          this.store.dispatch(experimentsActions.getExperiments());
        }
      });

    this.createFooterItemsRunner();


    this.selectExperimentFromUrl();
    this.store.dispatch(experimentsActions.getParents({searchValue: null}));
    effect(() => {
      if (this.projectId()) {
        this.store.dispatch(experimentsActions.getTags({}));
        this.store.dispatch(experimentsActions.getProjectTypes({}));
      }
    });
  }

  createFooterItemsRunner = () => this.createFooterItems({
    entitiesType: this.entityType,
    showAllSelectedIsActive$: this.showAllSelectedIsActive$,
    selected$: this.checkedExperiments$,
    tags$: this.tags$,
    data$: this.selectedExperimentsDisableAvailable$,
    companyTags$: this.companyTags$,
    projectTags$: this.store.select(selectSelectedProjectId).pipe(switchMap(id =>
      id === '*' ? this.companyTags$ : this.tags$
    )),
    tagsFilterByProject$: this.tagsFilterByProject$
  });

  protected emptyUrlInit() {
    this.store.dispatch(experimentsActions.updateUrlParams());
    this.shouldOpenDetails = true;
  }

  getSelectedEntities() {
    return this.checkedExperiments;
  }

  override createFooterItems(config: {
    entitiesType: EntityTypeEnum;
    selected$: Observable<ITableExperiment[]>;
    showAllSelectedIsActive$: Observable<boolean>;
    tags$: Observable<string[]>;
    data$?: Observable<Record<string, CountAvailableAndIsDisableSelectedFiltered>>;
    companyTags$: Observable<string[]>;
    projectTags$: Observable<string[]>;
    tagsFilterByProject$: Observable<boolean>;
  }) {
    super.createFooterItems(config);
    this.footerItems = [
      new ShowItemsFooterSelected(config.entitiesType),
      new CompareFooterItem(config.entitiesType),
      new DividerFooterItem(),
      new ArchiveFooterItem(config.entitiesType),
      new DeleteFooterItem(),
      new DividerFooterItem(),
      new EnqueueFooterItem(),
      new RetryFooterItem(),
      new DequeueFooterItem(),
      new ResetFooterItem(config.entitiesType),
      new AbortFooterItem(config.entitiesType),
      new AbortAllChildrenFooterItem(),
      new PublishFooterItem(this.entityType),
      new DividerFooterItem(),

      new SelectedTagsFooterItem(this.entityType),
      new DividerFooterItem(),

      new MoveToFooterItem(),
      new HasReadOnlyFooterItem()
    ];
  }

  onFooterHandler({emitValue, item}) {
    this.singleRowContext = false;
    window.setTimeout(() => {
      switch (item.id) {
        case MenuItems.showAllItems:
          this.showAllSelected(!emitValue);
          break;
        case MenuItems.compare:
          this.compareExperiments();
          break;
        case MenuItems.archive:
          this.contextMenu().restoreArchive(item.entitiesType);
          break;
        case MenuItems.reset:
          this.contextMenu().resetPopup();
          break;
        case MenuItems.publish:
          this.contextMenu().publishPopup();
          break;
        case MenuItems.retry:
          this.contextMenu().retryPopup();
          break;
        case MenuItems.enqueue:
          this.contextMenu().enqueuePopup();
          break;
        case MenuItems.dequeue:
          this.contextMenu().dequeuePopup();
          break;
        case MenuItems.delete:
          this.contextMenu().deleteExperimentPopup();
          break;
        case MenuItems.abort:
          this.contextMenu().stopPopup();
          break;
        case MenuItems.abortAllChildren:
          this.contextMenu().stopAllChildrenPopup();
          break;
        case MenuItems.moveTo:
          this.contextMenu().moveToProjectPopup();
          break;
      }
    });
  }

  onAddTag(tag: string, contextExperiment: ITableExperiment) {
    this.store.dispatch(addTag({
      tag,
      experiments: this.singleRowContext ? [contextExperiment] : this.checkedExperiments.filter(_selected => !isReadOnly(_selected))
    }));
    this.store.dispatch(experimentsActions.addProjectsTag({tag}));
  }

  setContextMenuStatus(menuStatus: boolean) {
    this.contextMenuActive = menuStatus;
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.store.dispatch(experimentsActions.resetExperiments({}));
    this.store.dispatch(setExperiment({experiment: null}));
    this.stopSyncSearch();
  }

  stopSyncSearch() {
    this.store.dispatch(resetSearch());
    this.store.dispatch(experimentsActions.resetGlobalFilter());
  }

  syncAppSearch() {
    this.store.dispatch(initSearch({payload: 'Search for tasks'}));

    this.searchQuery$
      .pipe(
        takeUntilDestroyed(),
        skip(1),
        filter(query => query !== null)
      )
      .subscribe(query => this.store.dispatch(experimentsActions.globalFilterChanged(query)));
  }

  selectExperimentFromUrl() {
    combineLatest([
      this.store.select(selectRouterParams).pipe(map(params => this.getParamId(params))),
      this.experiments$
    ])
      .pipe(
        takeUntilDestroyed(),
        debounceTime(0),
        concatLatestFrom(() => this.store.select(selectTableMode)),
        map(([[experimentId, experiments], mode]) => {
          this.firstExperiment = experiments?.[0];
          this.entities = experiments;
          const experimentsIds = (this.route.snapshot.firstChild?.firstChild ?? this.route.snapshot.firstChild)?.params?.ids?.split(',').filter(id => !!id);
          if (this.getTableModeFromURL() === 'compare' && experimentsIds?.length > 0 && this.checkedExperiments?.length === 0 && !this.previousSelectedIds) {
            this.store.dispatch(experimentsActions.getSelectedExperiments({ids: experimentsIds}));
          }
          this.previousSelectedIds = experimentsIds;
          if (!experimentId && this.shouldOpenDetails && this.firstExperiment && mode === 'info') {
            this.shouldOpenDetails = false;
            this.store.dispatch(experimentsActions.experimentSelectionChanged({
              experiment: this.firstExperiment,
              project: this.selectedProjectId
            }));
          } else if (mode !== 'compare' || ![EntityTypeEnum.experiment, EntityTypeEnum.controller].includes(this.entityType)) {
            this.store.dispatch(experimentsActions.setTableMode({mode: this.getTableModeFromURL()}));
          } else if (this.shouldOpenDetails) {
            this.modeChanged(mode);
            this.shouldOpenDetails = false;
          } else if (this.getTableModeFromURL() !== mode) {
            this.modeChanged(this.getTableModeFromURL());
          }
          this.shouldOpenDetails = false;
          return experiments.find(experiment => experiment.id === experimentId);
        }),
        distinctUntilChanged()
      )
      .subscribe((selectedExperiment) => {
          // this.tableMode = this.getTableModeFromURL();
          this.store.dispatch(experimentsActions.setTableMode({mode: this.tableMode()}));
          this.store.dispatch(experimentsActions.setSelectedExperiment({experiment: selectedExperiment}));
        }
      );
  }

  public getTableModeFromURL() {
    if (!this.route.snapshot.firstChild) {
      return 'table';
    }
    return this.route.snapshot.firstChild?.url[0].path === 'compare' ? 'compare' :
      this.route.snapshot.firstChild?.routeConfig.path === undefined ? 'table' : 'info';
  }

  getNextExperiments() {
    this.store.dispatch(experimentsActions.getNextExperiments());
  }

  experimentsSelectionChanged(experiments: ITableExperiment[]) {
    this.store.dispatch(experimentsActions.setSelectedExperiments({experiments}));
    if (this.getTableModeFromURL() === 'compare') {
      this.router.navigate(['compare'], {relativeTo: this.route, queryParamsHandling: 'preserve'});
    }
  }

  experimentSelectionChanged({experiment, openInfo, origin}: {
    experiment: ITableExperiment;
    openInfo?: boolean;
    origin: 'table' | 'row'
  }) {
    if (experiment) {
      if (this.minimizedView() || openInfo) {
        this.store.dispatch(experimentsActions.experimentSelectionChanged({
          experiment: experiment,
          project: this.selectedProjectId
        }));
      } else if (origin === 'row') {
        this.selectionState().highlited.update(current => current?.id === experiment.id ? null : experiment);
      }
    }
  }

  sortedChanged(event: { isShift: boolean; colId: ISmCol['id'] }) {
    this.store.dispatch(experimentsActions.tableSortChanged(event));
  }

  filterChanged({col, value, andFilter}: { col: ISmCol; value: any; andFilter?: boolean }) {
    this.store.dispatch(experimentsActions.tableFilterChanged({
      filters: [{
        col: col.id,
        value,
        filterMatchMode: col.filterMatchMode || andFilter ? 'AND' : undefined
      }], projectId: this.projectId()
    }));
  }

  compareExperiments() {
    this.router.navigate(
      [
        `compare-tasks`,
        {ids: this.checkedExperiments.map(experiment => experiment.id).join(',')}
      ],
      {relativeTo: this.route.parent.parent});
  }

  afterArchiveChanged() {
    this.store.dispatch(experimentsActions.showOnlySelected({active: false, projectId: this.projectId()}));
  }

  showAllSelected(active: boolean) {
    this.store.dispatch(experimentsActions.showOnlySelected({active, projectId: this.projectId()}));
  }

  selectedTableColsChanged(col: ISmCol) {
    this.store.dispatch(experimentsActions.toggleColHidden({columnId: col.id, projectId: this.projectId()}));
  }

  toggleSelectedMetricHidden(col: ISmCol) {
    this.store.dispatch(experimentsActions.toggleSelectedMetricCompare({
      columnId: col.id,
      projectId: this.projectId()
    }));
  }

  getMetricsToDisplay() {
    if (this.getTableModeFromURL() !== 'compare') {
      this.store.dispatch(experimentsActions.getCustomMetrics({hideLoader: true}));
      this.store.dispatch(experimentsActions.getCustomHyperParams());
    }
  }

  selectedMetricToShow(event: SelectionEvent) {
    if (!event.valueType) {
      return;
    }
    const variantCol = createMetricColumn({
      metricHash: event.variant.metric_hash,
      variantHash: event.variant.variant_hash,
      valueType: event.valueType,
      metric: event.variant.metric,
      variant: event.variant.variant
    }, this.projectId());
    if (event.addCol) {
      this.store.dispatch(experimentsActions.addColumn({col: variantCol}));
    } else {
      this.store.dispatch(experimentsActions.removeCol({id: variantCol.id, projectId: variantCol.projectId}));
    }
    this.store.dispatch(experimentsActions.updateUrlParams());
  }

  compareSelectedMetricToShow(event: SelectionEvent) {
    const variantCol = createCompareMetricColumn(event.variant);
    if (event.addCol) {
      this.store.dispatch(experimentsActions.addSelectedMetric({col: variantCol, projectId: this.projectId()}));
    } else {
      this.store.dispatch(experimentsActions.removeSelectedMetric({id: variantCol.id, projectId: this.projectId()}));
    }
  }

  createParamColumn(param: string, projectId?: string): ISmCol {
    return {
      id: param,
      getter: encodeHyperParameter(param),
      headerType: ColHeaderTypeEnum.sortFilter,
      sortable: true,
      filterable: true,
      header: decodeURIComponentSafe(param.replace('hyperparams.', '')),
      hidden: false,
      projectId: projectId || this.projectId(),
      isParam: true,
      style: {width: '200px'},
      searchableFilter: true,
      asyncFilter: true,
      paginatedFilterPageSize: rootProjectsPageSize
    };
  }

  selectedHyperParamToShow(event: { param: string; addCol: boolean }) {
    const variantCol = this.createParamColumn(event.param);
    if (event.addCol) {
      this.store.dispatch(experimentsActions.addColumn({col: variantCol}));
    } else {
      this.store.dispatch(experimentsActions.removeCol({id: variantCol.id, projectId: variantCol.projectId}));
    }
    this.store.dispatch(experimentsActions.updateUrlParams());
  }

  removeColFromList(colId: string) {
    const sortIndex = this.sortFields.findIndex(field => field.field === colId);
    if (sortIndex > -1) {
      this.store.dispatch(experimentsActions.resetSortOrder({sortIndex, projectId: this.projectId()}));
    }
    this.store.dispatch(experimentsActions.removeCol({id: colId, projectId: this.projectId()}));
    this.store.dispatch(experimentsActions.updateUrlParams());
  }

  compareRemoveColFromList(colId: string) {
    this.store.dispatch(experimentsActions.removeSelectedMetric({id: colId, projectId: this.projectId()}));
  }

  columnResized(event: { columnId: string; widthPx: number }) {
    this.store.dispatch(experimentsActions.setColumnWidth({
      ...event,
      projectId: this.projectId()
    }));
  }

  refreshList(isAutoRefresh: boolean) {
    this.store.dispatch(experimentsActions.refreshExperiments({
      hideLoader: isAutoRefresh,
      autoRefresh: isAutoRefresh
    }));
  }

  setAutoRefresh($event: boolean) {
    this.store.dispatch(setAutoRefresh({autoRefresh: $event}));
  }

  clearSelection() {
    this.store.dispatch(experimentsActions.clearHyperParamsCols({projectId: this.projectId()}));
  }

  columnsReordered(cols: string[], updateUrl = true) {
    this.store.dispatch(experimentsActions.setColsOrderForProject({
      cols: Array.from(new Set([...cols, 'project.name'])),
      projectId: this.projectId()
    }));
    if (updateUrl) {
      this.store.dispatch(experimentsActions.updateUrlParams());
    }
  }

  refreshTagsList() {
    this.store.dispatch(experimentsActions.getTags({}));
  }

  refreshTypesList() {
    this.store.dispatch(experimentsActions.getProjectTypes({}));
  }

  protected getParamId(params) {
    return params?.experimentId;
  }

  clearTableFiltersHandler(tableFilters: Record<string, FilterMetadata>) {
    const filters = Object.keys(tableFilters).map(col => ({col, value: []}));
    this.store.dispatch(experimentsActions.tableFilterChanged({filters, projectId: this.selectedProjectId}));
  }

  onContextMenuOpen({x, y, single, backdrop}: { x: number; y: number; single?: boolean; backdrop?: boolean }) {
    this.singleRowContext = single;
    this.menuBackdrop = !!backdrop;
    this.contextMenu().openMenu({x, y});
  }

  getSingleSelectedDisableAvailable(experiment): Record<string, CountAvailableAndIsDisableSelectedFiltered> {
    return {
      [MenuItems.abort]: selectionDisabledAbort([experiment]),
      [MenuItems.abortAllChildren]: selectionDisabledAbortAllChildren([experiment]),
      [MenuItems.publish]: selectionDisabledPublishExperiments([experiment]),
      [MenuItems.reset]: selectionDisabledReset([experiment]),
      [MenuItems.delete]: selectionDisabledDelete([experiment]),
      [MenuItems.moveTo]: selectionDisabledMoveTo([experiment]),
      [MenuItems.enqueue]: selectionDisabledEnqueue([experiment]),
      [MenuItems.retry]: selectionDisabledRetry([experiment]),
      [MenuItems.dequeue]: selectionDisabledDequeue([experiment]),
      [MenuItems.queue]: selectionDisabledQueue([experiment]),
      [MenuItems.viewWorker]: selectionDisabledViewWorker([experiment]),
      [MenuItems.archive]: selectionDisabledArchive([experiment]),
      [MenuItems.run]: selectionDisabledPipelineRun([experiment])
    };
  }

  modeChanged(mode: 'info' | 'table' | 'compare') {
    if (this.tableMode() !== mode) {
      this.store.dispatch(experimentsActions.setTableMode({mode}));
    }
    setTimeout(() => this.createFooterItemsRunner(), 100);
    if (mode === 'info') {
      this.store.dispatch(experimentsActions.experimentSelectionChanged({
        experiment: this.selectionState().highlited() || this.checkedExperiments?.[0] || this.firstExperiment,
        project: this.selectedProjectId
      }));
      return Promise.resolve();
    } else if (mode === 'compare') {
      setTimeout(() => {
        const experimentsIds = (this.route.snapshot.firstChild?.firstChild ?? this.route.snapshot.firstChild)?.params?.ids?.split(',').filter(id => !!id);
        this.store.dispatch(experimentsActions.getSelectedExperiments({ids: experimentsIds}));
      })
      return this.compareView();
    } else {
      return this.closePanel();
    }
  }

  newExperiment() {
    this.dialog.open(CreateExperimentDialogComponent, {
      width: '800px',
      disableClose: true
    }).afterClosed()
      .pipe(filter(res => !!res))
      .subscribe(data => this.store.dispatch(experimentsActions.createExperiment({data})));
  }

  downloadTableAsCSV() {
    this.table().table().downloadTableAsCSV(`ClearML ${this.selectedProject().id === '*' ? 'All' : this.selectedProject()?.basename?.substring(0, 60)} Experiments`);
  }

  downloadFullTableAsCSV() {
    this.store.dispatch(experimentsActions.prepareTableForDownload({entityType: 'task'}));
  }

  override setupBreadcrumbsOptions() {
    effect(() => {
      const selectedProject = this.selectedProject();
      if (selectedProject) {
        this.store.dispatch(setBreadcrumbsOptions({
          breadcrumbOptions: {
            showProjects: !!selectedProject,
            featureBreadcrumb: {
              name: 'PROJECTS',
              url: 'projects'
            },
            ...(this.projectDeepMode() && selectedProject?.id !== '*' && {
              subFeatureBreadcrumb: {
                name: 'All Tasks'
              }
            }),
            projectsOptions: {
              basePath: 'projects',
              filterBaseNameWith: null,
              compareModule: null,
              showSelectedProject: selectedProject?.id !== '*',
              ...(selectedProject && {
                selectedProjectBreadcrumb: {
                  name: selectedProject?.id === '*' ? 'All Tasks' : selectedProject?.basename,
                  url: `projects/${selectedProject?.id}/projects`
                }
              })
            }
          }
        }));
      }
    });
  }

  showCompareSettingsChanged() {
    this.store.dispatch(experimentsActions.toggleCompareScalarSettings());
  }

  compareViewChanged(compareView: 'scalars' | 'plots') {
    this.store.dispatch(experimentsActions.setCompareView({mode: compareView}));
    return this.router.navigate(['compare'], {relativeTo: this.route, queryParamsHandling: 'preserve'});
  }

  override filterSearchChanged({colId, value}: { colId: string; value: { value: string; loadMore?: boolean } }) {
    super.filterSearchChanged({colId, value});
    if (colId === 'parent.name') {
      // No pagination in BE - setting same list will set noMoreOptions to true
      if (value.loadMore) {
        this.store.dispatch(experimentsActions.setParents({parents: [...this.parents]}));
      } else {
        this.store.dispatch(experimentsActions.resetTablesFilterParentsOptions());
        this.store.dispatch(experimentsActions.getParents({searchValue: value.value}));
      }
    } else if (colId.startsWith('hyperparams.')) {
      if (!value.loadMore) {
        this.store.dispatch(experimentsActions.hyperParamSelectedInfoExperiments({
          col: {id: colId},
          loadMore: false,
          values: null
        }));
        this.store.dispatch(experimentsActions.setHyperParamsFiltersPage({page: 0}));
      }
      this.store.dispatch(experimentsActions.hyperParamSelectedExperiments({
        col: {id: colId, getter: `${colId}.value`},
        searchValue: value.value
      }));
    }
  }

}
