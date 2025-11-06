import {ChangeDetectionStrategy, Component, computed, effect, OnDestroy, signal, ViewChild} from '@angular/core';
import {isEqual} from 'lodash-es';
import {combineLatest, Observable} from 'rxjs';
import {distinctUntilChanged, filter, map, skip, switchMap, withLatestFrom} from 'rxjs/operators';
import {
  getCompanyTags, getProjectUsers,
  getTags,
  setArchive as setProjectArchive,
  setBreadcrumbsOptions,
  setDeep, setSelectedProject
} from '../core/actions/projects.actions';
import {initSearch, resetSearch} from '../common-search/common-search.actions';
import {selectSearchQuery} from '../common-search/common-search.reducer';
import {resetAceCaretsPositions, setAutoRefresh} from '../core/actions/layout.actions';
import {
  selectCompanyTags,
  selectIsArchivedMode,
  selectProjectSystemTags,
  selectProjectTags, selectRouterProjectId,
  selectSelectedProjectId,
  selectTagsFilterByProject
} from '../core/reducers/projects.reducer';
import {BaseEntityPageComponent} from '../shared/entity-page/base-entity-page';
import {FilterMetadata} from 'primeng/api';
import {ISmCol, TableSortOrderEnum} from '../shared/ui-components/data/table/table.consts';
import {
  createMetadataCol,
  createMetricColumn,
  decodeColumns,
  decodeFilter,
  decodeOrder
} from '../shared/utils/tableParamEncode';
import * as modelsActions from './actions/models-view.actions';
import {MODELS_TABLE_COLS} from './models.consts';
import * as modelsSelectors from './reducers';
import {
  selectFilteredTableCols, selectIsModelInEditMode,
  selectMetadataColsOptions,
  selectMetadataKeys,
  selectMetricVariants,
  selectModelsFrameworks,
  selectModelsTags, selectSelectedTableModel,
  selectTableMode
} from './reducers';
import {SelectedModel, TableModel} from './shared/models.model';
import {selectIsSharedAndNotOwner} from '~/features/experiments/reducers';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {ShowItemsFooterSelected} from '../shared/entity-page/footer-items/show-items-footer-selected';
import {DividerFooterItem} from '../shared/entity-page/footer-items/divider-footer-item';
import {ArchiveFooterItem} from '../shared/entity-page/footer-items/archive-footer-item';
import {DeleteFooterItem} from '../shared/entity-page/footer-items/delete-footer-item';
import {MoveToFooterItem} from '../shared/entity-page/footer-items/move-to-footer-item';
import {addTag} from './actions/models-menu.actions';
import {ModelsTableComponent} from './shared/models-table/models-table.component';
import {CountAvailableAndIsDisableSelectedFiltered, MenuItems} from '../shared/entity-page/items.utils';
import {PublishFooterItem} from '../shared/entity-page/footer-items/publish-footer-item';
import {HasReadOnlyFooterItem} from '../shared/entity-page/footer-items/has-read-only-footer-item';
import {SelectedTagsFooterItem} from '../shared/entity-page/footer-items/selected-tags-footer-item';
import {CompareFooterItem} from '@common/shared/entity-page/footer-items/compare-footer-item';
import {CustomColumnMode} from '@common/experiments/shared/common-experiments.const';
import {ALL_PROJECTS_OBJECT} from '@common/core/effects/projects.effects';
import {
  SelectionEvent
} from '@common/experiments/dumb/select-metric-for-custom-col/select-metric-for-custom-col.component';
import {computedPrevious} from 'ngxtension/computed-previous';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {MemoizedSelector} from '@ngrx/store';
import {ProjectsGetUserNamesRequest} from '~/business-logic/model/projects/projectsGetUserNamesRequest';
import {distinctParamsUntilChanged$} from '@common/projects/common-projects.utils';


@Component({
  selector: 'sm-models',
  templateUrl: './models.component.html',
  styleUrls: ['./models.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class ModelsComponent extends BaseEntityPageComponent implements OnDestroy {
  public readonly originalTableColumns = MODELS_TABLE_COLS;
  public entityTypeEnum = EntityTypeEnum;
  private modelsFeature = false;
  public models$: Observable<TableModel[]>;
  public tableSortOrder$: Observable<TableSortOrderEnum>;
  public showInfo$: Observable<boolean>;
  public tableCols$: Observable<ISmCol[]>;
  public firstModel: TableModel;
  protected override addTag = addTag;
  protected override setSplitSizeAction = modelsActions.setSplitSize;
  protected setTableModeAction = modelsActions.setTableMode;
  protected override splitSize = this.store.selectSignal(modelsSelectors.selectSplitSize);
  protected tableSortFields$ = this.store.select(modelsSelectors.selectTableSortFields);
  protected checkedModels = this.store.selectSignal(modelsSelectors.selectSelectedModels);
  protected selectedModelsDisableAvailable$ = this.store.select(modelsSelectors.selectSelectedModelsDisableAvailable);
  protected tableFilters$ = this.store.select(modelsSelectors.selectTableFilters);
  protected isArchived$ = this.store.select(selectIsArchivedMode);
  protected noMoreModels$ = this.store.select(modelsSelectors.selectNoMoreModels);
  protected isSharedAndNotOwner$ = this.store.select(selectIsSharedAndNotOwner);
  protected metadataColsOptions$ = this.store.select(selectMetadataColsOptions);
  protected metricVariants$ = this.store.select(selectMetricVariants);
  protected modelsPage$ = this.store.select(modelsSelectors.selectModelsPage);

  protected override showAllSelectedIsActive$ = this.store.select(modelsSelectors.selectShowAllSelectedIsActive);
  protected searchQuery$ = this.store.select(selectSearchQuery);
  protected tableColsOrder$ = this.store.select(modelsSelectors.selectModelsTableColsOrder);
  protected tags$ = this.store.select(selectModelsTags);
  protected metadataKeys$ = this.store.select(selectMetadataKeys);
  protected tagsFilterByProject$ = this.store.select(selectTagsFilterByProject);
  protected projectTags$ = this.store.select(selectProjectTags);
  protected companyTags$ = this.store.select(selectCompanyTags);
  protected systemTags$ = this.store.select(selectProjectSystemTags);
  protected frameworks$ = this.store.select(selectModelsFrameworks);
  override tableMode = this.store.selectSignal(selectTableMode);
  protected filteredTableCols$ = this.store.select(selectFilteredTableCols);

  protected selectedTableModel = toSignal(this.store.select(selectSelectedTableModel)
    .pipe(distinctUntilChanged((a, b) => a?.id === b?.id)));
  private previousTableModel = computedPrevious(this.selectedTableModel);
  protected selectionState = computed(() => ({
    prevExperiment: this.previousTableModel(),
    highlited: signal(this.selectedTableModel() ?? this.previousTableModel())
  }));


  @ViewChild('modelsTable') private table: ModelsTableComponent;

  protected override get entityType() {
    return EntityTypeEnum.model;
  }

  override get selectEditMode(): MemoizedSelector<unknown, boolean> | undefined {
    return selectIsModelInEditMode;
  }

  constructor() {
    super();
    this.store.dispatch(getProjectUsers({projectId: this.selectedProjectId, entity: ProjectsGetUserNamesRequest.EntityEnum.Model}))
    let child = this.route.snapshot;
    while (child.firstChild && !child.data.setAllProject) {
      child = child.firstChild;
    }
    if (child.data.setAllProject) {
      this.store.dispatch(getCompanyTags());
      this.modelsFeature = true;
    }

    this.tableCols$ = this.filteredTableCols$.pipe(
      distinctUntilChanged(isEqual),
      map(cols => cols.filter(col => !col.hidden))
    );

    this.models$ = this.store.select(modelsSelectors.selectModelsList).pipe(
      filter(models => models !== null),
      withLatestFrom(this.isArchived$),
      // lil hack for hiding archived models after they been archived from models info or footer...
      map(([models, showArchived]) => this.filterArchivedModels(models, showArchived)),
    );
    this.showInfo$ = this.store.select(modelsSelectors.selectModelId);
    this.syncAppSearch();

    effect(() => {
      if(this.modelsFeature && !this.selectedProject()) {
        this.store.dispatch(setSelectedProject({project: ALL_PROJECTS_OBJECT}))
      }
    });

    distinctParamsUntilChanged$(combineLatest([
      this.store.select(selectRouterProjectId),
      this.route.queryParams,
    ]))
      .subscribe(([prevProjectId, projectId, params]) => {
        if (projectId !== prevProjectId && Object.keys(params || {}).length === 0) {
          this.emptyUrlInit();
        } else {
          this.setupContextMenu('models', params.archive === 'true');
          if (params.columns) {
            const [, metrics, , metadataCols, allIds] = decodeColumns(params.columns, this.originalTableColumns);
            const hiddenCols = {};
            this.originalTableColumns.forEach((tableCol) => {
              if (tableCol.id !== 'selected') {
                hiddenCols[tableCol.id] = !params.columns.includes(tableCol.id);
              }
            });
            this.store.dispatch(modelsActions.setHiddenCols({hiddenCols}));
            this.store.dispatch(modelsActions.setExtraColumns({
              projectId: projectId ?? this.projectId(),
              columns: metadataCols.map(metadataCol => createMetadataCol(metadataCol, projectId))
                .concat(metrics.map(metricCol => createMetricColumn(metricCol, projectId)))
            }));
            this.columnsReordered(allIds, false);
          }
          if (params.order) {
            const orders = decodeOrder(params.order);
            this.store.dispatch(modelsActions.setTableSort({orders, projectId: this.projectId()}));
          }
          if (params.filter != null) {
            const filters = decodeFilter(params.filter);
            this.store.dispatch(modelsActions.setTableFilters({filters, projectId: this.selectedProjectId}));
          } else {
            if (params.order) {
              this.store.dispatch(modelsActions.setTableFilters({filters: [], projectId}));
            }
          } if (params.deep) {
            this.store.dispatch(setDeep({deep: true}));
          }
          this.store.dispatch(setProjectArchive({archive: !!params.archive}));
          this.store.dispatch(modelsActions.fetchModelsRequested());
        }
      });

    this.createFooterItems({
      entitiesType: EntityTypeEnum.model,
      selected$: this.store.select(modelsSelectors.selectSelectedModels),
      showAllSelectedIsActive$: this.showAllSelectedIsActive$,
      tags$: this.tags$,
      data$: this.selectedModelsDisableAvailable$,
      tagsFilterByProject$: this.tagsFilterByProject$,
      companyTags$: this.companyTags$,
      projectTags$: this.store.select(selectSelectedProjectId).pipe(switchMap(id =>
        id === '*' ? this.companyTags$ : this.projectTags$
      )),
    });

    this.selectModelFromUrl();
    this.store.dispatch(modelsActions.getFrameworks());
    this.store.dispatch(modelsActions.getTags());
    this.store.dispatch(getTags());
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.store.dispatch(modelsActions.resetState());
    this.stopSyncSearch();
  }

  private emptyUrlInit() {
    this.store.dispatch(modelsActions.updateUrlParams());
    this.shouldOpenDetails = true;
  }

  getSelectedEntities() {
    return this.checkedModels();
  }

  stopSyncSearch() {
    this.store.dispatch(resetSearch());
    this.store.dispatch(modelsActions.resetGlobalFilter());
  }

  syncAppSearch() {
    this.store.dispatch(initSearch({payload: 'Search for models'}));
    this.searchQuery$
      .pipe(
        takeUntilDestroyed(),
        skip(1),
        filter(query => query !== null)
      )
      .subscribe(query => this.store.dispatch(modelsActions.globalFilterChanged(query)));
  }

  getNextModels() {
    this.store.dispatch(modelsActions.getNextModels());
  }

  selectModelFromUrl() {
    combineLatest([
        this.store.select(modelsSelectors.selectModelId),
        this.models$
      ])
        .pipe(
          takeUntilDestroyed(),
          withLatestFrom(this.store.select(selectTableMode)),
          map(([[id, models], mode]) => {
            this.firstModel = models?.[0];
            if (!id && this.shouldOpenDetails && this.firstModel && mode === 'info') {
              this.shouldOpenDetails = false;
              this.store.dispatch(modelsActions.modelSelectionChanged({
                model: this.firstModel,
                project: this.projectId()
              }));
            } else {
              this.store.dispatch(modelsActions.setTableMode({mode: id ? 'info' : 'table'}));
            }
            this.shouldOpenDetails = false;
            return models?.find(model => model.id === id);
          }),
          distinctUntilChanged()
        )
        .subscribe((selectedModel) => {
          this.store.dispatch(modelsActions.setSelectedModel({model: selectedModel}));
          this.store.dispatch(resetAceCaretsPositions());
        });
  }

  filterArchivedModels(models: TableModel[], showArchived: boolean) {
    if (showArchived) {
      return models?.filter(model => model.system_tags && model.system_tags.includes('archived'));
    } else {
      return models?.filter(model => !model.system_tags || !(model.system_tags.includes('archived')));
    }
  }

  modelSelectionChanged({model, openInfo, origin}: {model: SelectedModel; openInfo?: boolean; origin: 'row' | 'table'}) {
    if(model) {
      if (this.minimizedView() || openInfo) {
        this.store.dispatch(modelsActions.modelSelectionChanged({
          model: model,
          project: this.projectId()
        }));
      } else if (origin === 'row') {
        this.selectionState().highlited.update(current => current?.id === model.id ? null : model);
      }
    }
  }

  modelsSelectionChanged(models: SelectedModel[]) {
    this.store.dispatch(modelsActions.setSelectedModels({models}));
  }

  sortedChanged({colId, isShift}: { isShift: boolean; colId: string }) {
    this.store.dispatch(modelsActions.tableSortChanged({colId, isShift}));
  }

  filterChanged({col, value, andFilter}: { col: ISmCol; value: any; andFilter?: boolean }) {

    this.store.dispatch(modelsActions.tableFilterChanged({
      filters: [{
        col: col.id,
        value,
        filterMatchMode: col.filterMatchMode || andFilter ? 'AND' : undefined
      }],
      projectId: this.projectId()
    }));
  }

  afterArchiveChanged() {
    this.store.dispatch(modelsActions.showSelectedOnly({active: false, projectId: this.projectId()}));
  }

  refreshList(isAutorefresh: boolean) {
    this.store.dispatch(modelsActions.refreshModels({hideLoader: isAutorefresh, autoRefresh: isAutorefresh}));
  }


  showAllSelected(active: boolean) {
    this.store.dispatch(modelsActions.showSelectedOnly({active, projectId: this.projectId()}));
  }

  setAutoRefresh($event: boolean) {
    this.store.dispatch(setAutoRefresh({autoRefresh: $event}));
  }

  columnsReordered(cols: string[], updateUrl = true) {
    this.store.dispatch(modelsActions.setColsOrderForProject({cols, projectId: this.projectId()}));
    if (updateUrl) {
      this.store.dispatch(modelsActions.updateUrlParams());
    }
  }

  selectedTableColsChanged(col: ISmCol) {
    this.store.dispatch(modelsActions.toggleColHidden({columnId: col.id, projectId: this.projectId()}));
  }

  columnResized(event: { columnId: string; widthPx: number }) {
    this.store.dispatch(modelsActions.setColumnWidth({
      ...event,
      projectId: this.projectId(),
    }));
  }

  refreshTagsList() {
    this.store.dispatch(modelsActions.getTags());
  }

  protected getParamId(params) {
    return params?.modelId;
  }

  override createFooterItems(config: {
    entitiesType: EntityTypeEnum;
    selected$: Observable<SelectedModel[]>;
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
      new SelectedTagsFooterItem(config.entitiesType),
      new DividerFooterItem(),

      new MoveToFooterItem(),
      new PublishFooterItem(EntityTypeEnum.model),
      new HasReadOnlyFooterItem()
    ];
  }

  onFooterHandler({emitValue, item}) {
    this.table.singleRowContext = false;
    window.setTimeout(() => {
      switch (item.id) {
        case MenuItems.showAllItems:
          this.showAllSelected(!emitValue);
          break;
        case MenuItems.compare:
          this.compareExperiments();
          break;
        case MenuItems.archive:
          this.table.contextMenuExtended().contextMenu().archiveClicked();
          break;
        case MenuItems.delete:
          this.table.contextMenuExtended().contextMenu().deleteModelPopup();
          break;
        case MenuItems.moveTo:
          this.table.contextMenuExtended().contextMenu().moveToProjectPopup();
          break;
        case MenuItems.publish:
          this.table.contextMenuExtended().contextMenu().publishPopup();
          break;
      }
    });
  }

  compareExperiments() {
    this.router.navigate(
      [
        `compare-models`,
        {ids: this.checkedModels().map(experiment => experiment.id).join(',')},
        'models-details'
      ],
      {relativeTo: this.route.parent.parent});
  }

  clearTableFiltersHandler(tableFilters: Record<string, FilterMetadata>) {
    const filters = Object.keys(tableFilters).map(col => ({col, value: []}));
    this.store.dispatch(modelsActions.tableFilterChanged({filters, projectId: this.projectId()}));
  }

  selectMetadataKeysActiveChanged(mode: { customMode: CustomColumnMode }) {
    // if (mode.customMode === CustomColumnMode.Metadata) {
      this.store.dispatch(modelsActions.getMetadataKeysForProject());
    // } else if (mode.customMode === CustomColumnMode.Metrics) {
      this.store.dispatch(modelsActions.getCustomMetrics());
    // }
  }


  addOrRemoveMetadataKeyFromColumns($event: { key: string; show: boolean }) {
    if ($event.show) {
      this.store.dispatch(modelsActions.addColumn({col: createMetadataCol($event.key, this.projectId())}));
    } else {
      this.store.dispatch(modelsActions.removeCol({id: $event.key, projectId: this.projectId()}));
    }
  }

  removeColFromList(id: string) {
    if (id.startsWith('last_metrics')) {
      this.store.dispatch(modelsActions.removeMetricCol({id, projectId: this.projectId()}));
    } else {
      this.store.dispatch(modelsActions.removeCol({id: id.split('.')[1], projectId: this.projectId()}));
    }
  }

  modeChanged(mode: 'table' | 'info' | 'compare') {
    if (mode === 'info') {
      this.store.dispatch(modelsActions.setTableMode({mode}));
      if (this.firstModel) {
        this.store.dispatch(modelsActions.modelSelectionChanged({
          model: this.selectionState().highlited() || this.checkedModels()?.[0] || this.firstModel,
          project: this.projectId()
        }));
      }
      return Promise.resolve()
    } else {
      return this.closePanel();
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
      this.store.dispatch(modelsActions.addColumn({col: variantCol}));
    } else {
      this.store.dispatch(modelsActions.removeMetricCol({id: variantCol.id, projectId: variantCol.projectId}));
    }
  }

  downloadTableAsCSV() {
    this.table.table().downloadTableAsCSV(`ClearML ${this.selectedProject().id === '*'? 'All': this.selectedProject()?.basename?.substring(0, 60)} Models`);
  }

  downloadFullTableAsCSV() {
    this.store.dispatch(modelsActions.prepareTableForDownload({entityType: 'model'}));
  }

  override setupBreadcrumbsOptions() {
    effect(() => {
      const selectedProject = this.selectedProject();
      if (selectedProject) {
        if (this.modelsFeature) {
          this.store.dispatch(setBreadcrumbsOptions({
            breadcrumbOptions: {
              showProjects: false,
              featureBreadcrumb: {name: 'Models'},
            }
          }));
        } else {
          this.store.dispatch(setBreadcrumbsOptions({
            breadcrumbOptions: {
              showProjects: !!selectedProject && !this.modelsFeature,
              featureBreadcrumb: {
                name: 'PROJECTS',
                url: 'projects'
              },
              ...(this.projectDeepMode() && selectedProject?.id !== '*' && {
                subFeatureBreadcrumb: {
                  name: 'All Models'
                }
              }),
              projectsOptions: {
                basePath: 'projects',
                filterBaseNameWith: null,
                compareModule: null,
                showSelectedProject: selectedProject?.id !== '*',
                ...(selectedProject && {
                  selectedProjectBreadcrumb: {
                    name: selectedProject?.id === '*' ? 'All Models' : selectedProject?.basename,
                    url: `projects/${selectedProject?.id}/projects`
                  }
                })
              }
            }
          }));
        }
      }
    });
  }
}
