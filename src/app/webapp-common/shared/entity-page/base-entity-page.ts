import {
  Component, computed,
  DestroyRef, effect,
  inject,
  OnDestroy,
  Signal,
  viewChild
} from '@angular/core';
import {Action, ActionCreator, MemoizedSelector, Store} from '@ngrx/store';
import {combineLatest, Observable, of, switchMap} from 'rxjs';
import {debounceTime, filter, map, take, tap} from 'rxjs/operators';
import {
  selectDefaultNestedModeForFeature,
  selectIsArchivedMode, selectIsDeepMode, selectMinimizedView, selectRouterProjectId,
  selectSelectedProject,
  selectSelectedProjectUsers,
  selectTablesFilterProjectsOptions
} from '../../core/reducers/projects.reducer';
import {SplitComponent, SplitGutterInteractionEvent} from 'angular-split';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {IFooterState, ItemFooterModel} from './footer-items/footer-items.models';
import {
  CountAvailableAndIsDisableSelectedFiltered,
  selectionAllHasExample,
  selectionAllIsArchive,
  selectionExamplesCount,
  selectionHasExample
} from './items.utils';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {
  getTablesFilterProjectsOptions,
  resetProjectSelection, resetTablesFilterProjectsOptions,
  setTablesFilterProjectsOptions
} from '@common/core/actions/projects.actions';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {RefreshService} from '@common/core/services/refresh.service';
import {selectTableModeAwareness} from '@common/projects/common-projects.reducer';
import {setTableModeAwareness} from '@common/projects/common-projects.actions';
import {neverShowPopupAgain, toggleCardsCollapsed} from '../../core/actions/layout.actions';
import {selectNeverShowPopups, selectTableCardsCollapsed} from '../../core/reducers/view.reducer';
import {isReadOnly} from '@common/shared/utils/is-read-only';
import {setCustomMetrics} from '@common/models/actions/models-view.actions';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import {HeaderMenuService} from '~/shared/services/header-menu.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {concatLatestFrom} from '@ngrx/operators';
import {resetTablesFilterParentsOptions} from '@common/experiments/actions/common-experiments-view.actions';

@Component({
  selector: 'sm-base-entity-page',
  template: '',
  standalone: false
})
export abstract class BaseEntityPageComponent implements OnDestroy {
  protected store = inject(Store);
  protected route = inject(ActivatedRoute);
  protected router = inject(Router);
  protected dialog = inject(MatDialog);
  protected refresh = inject(RefreshService);
  protected contextMenuService = inject(HeaderMenuService);
  protected readonly destroyRef = inject(DestroyRef);

  protected entities = [];
  protected setSplitSizeAction: ActionCreator<string, (props: {splitSize: number}) => ({splitSize: number} & Action)>;
  protected addTag: ActionCreator<string, (props: {tag: string}) => ({tag: string} & Action)>;
  protected abstract setTableModeAction: ActionCreator<string, (props: {mode: string}) => ({mode: string} & Action)>;
  public shouldOpenDetails = false;
  public checkedExperiments: IExperimentInfo[];
  public projectId = this.store.selectSignal(selectRouterProjectId);
  protected splitSize?: Signal<number>;
  public infoDisabled: boolean;
  public footerItems = [] as ItemFooterModel[];
  public footerState$: Observable<IFooterState<{ id: string }>>;
  public tableModeAwareness$: Observable<boolean>;
  private tableModeAwareness: boolean;
  protected users = this.store.selectSignal(selectSelectedProjectUsers);
  protected projectsOptions = this.store.selectSignal(selectTablesFilterProjectsOptions);
  protected defaultNestedModeForFeature = this.store.selectSignal(selectDefaultNestedModeForFeature);
  protected projectDeepMode = this.store.selectSignal(selectIsDeepMode);
  protected cardsCollapsed = this.store.selectSignal(selectTableCardsCollapsed(this.entityType));
  protected selectedProject = this.store.selectSignal(selectSelectedProject);
  protected allProjects = computed(() => this.selectedProject()?.id === '*');
  protected exampleProject = computed(() => isReadOnly(this.selectedProject()));
  protected tableMode: Signal<'info' | 'table' | 'compare'>;
  protected parents = [];

  protected split = viewChild(SplitComponent);
  private currentSelection: { id: string }[];
  protected showAllSelectedIsActive$: Observable<boolean>;
  protected minimizedView = this.store.selectSignal(selectMinimizedView(this.getParamId));
  protected inArchivedMode = this.store.selectSignal(selectIsArchivedMode);

  abstract onFooterHandler({emitValue, item}): void;

  abstract getSelectedEntities();

  abstract afterArchiveChanged();

  protected abstract getParamId(params);

  abstract refreshList(auto: boolean);


  get selectedProjectId() {
    return this.route.parent.snapshot.params.projectId;
  }

  get selectEditMode(): MemoizedSelector<unknown, boolean> | undefined {
    return undefined;
  }
  protected get entityType(): EntityTypeEnum {
    return undefined;
  };

  protected constructor() {
    effect(() => {
      if (this.tableMode) {
        this.shouldOpenDetails = this.tableMode() !== 'table';
      }
    });

    this.tableModeAwareness$ = this.store.select(selectTableModeAwareness)
      .pipe(
        filter(featuresAwareness => featuresAwareness !== null && featuresAwareness !== undefined),
        tap(aware => this.tableModeAwareness = aware)
      );


    this.refresh.tick
      .pipe(
        takeUntilDestroyed(),
        concatLatestFrom(() => [
          ...(this.selectEditMode ? [this.store.select(this.selectEditMode)] : []),
          this.showAllSelectedIsActive$]
        ),
        filter(([tick, edit, showAllSelectedIsActive]) => !tick && !edit && !showAllSelectedIsActive),
        map(([auto]) => auto)
      )
      .subscribe(auto => this.refreshList(auto !== false));
    this.setupBreadcrumbsOptions();
  }


  ngOnDestroy(): void {
    this.footerItems = [];
    this.store.dispatch(setCustomMetrics({metrics: null}));
  }

  closePanel(queryParams?: Params) {
    window.setTimeout(() => this.infoDisabled = false);
    this.store.dispatch(this.setTableModeAction({mode: 'table'}));
    return this.router.navigate(this.minimizedView() ? [{}] : [], {
      relativeTo: this.route,
      queryParamsHandling: 'merge',
      queryParams
    });
  }

  protected compareView() {
    this.router.navigate(['compare'], {relativeTo: this.route, queryParamsHandling: 'preserve'});
  }

  splitSizeChange(event: SplitGutterInteractionEvent) {
    const size = event.sizes[1] as number;
    if (this.setSplitSizeAction) {
      this.store.dispatch(this.setSplitSizeAction({splitSize: size}));
    }
    this.infoDisabled = false;
  }

  disableInfoPanel() {
    this.infoDisabled = true;
  }

  clickOnSplit() {
    this.infoDisabled = false;
  }

  tableModeUserAware() {
    if (this.tableModeAwareness === true) {
      this.store.dispatch(setTableModeAwareness({awareness: false}));
    }
  }

  tagSelected({tag, emitValue}, entitiesType) {
    this.store.dispatch(this.addTag({
      tag,
      [entitiesType]: emitValue
    }));
  }

  createFooterItems(config: {
    entitiesType: EntityTypeEnum;
    selected$: Observable<{ id: string }[]>;
    showAllSelectedIsActive$: Observable<boolean>;
    data$?: Observable<Record<string, CountAvailableAndIsDisableSelectedFiltered>>;
    tags$?: Observable<string[]>;
    companyTags$?: Observable<string[]>;
    projectTags$?: Observable<string[]>;
    tagsFilterByProject$?: Observable<boolean>;
  }) {
    this.footerState$ = this.createFooterState(
      config.selected$,
      config.data$,
      config.showAllSelectedIsActive$,
      this.allProjects() ? of(null) : config.companyTags$,
      this.allProjects() ? config.companyTags$ : config.projectTags$,
      this.allProjects() ? of(true) : config.tagsFilterByProject$
    );
  }

  createFooterState<T extends { id: string }>(
    selected$: Observable<T[]>,
    data$?: Observable<Record<string, CountAvailableAndIsDisableSelectedFiltered>>,
    showAllSelectedIsActive$?: Observable<boolean>,
    companyTags$?: Observable<string[]>,
    projectTags$?: Observable<string[]>,
    tagsFilterByProject$?: Observable<boolean>
  ): Observable<IFooterState<T>> {
    data$ = data$ || of({});
    projectTags$ = projectTags$ || of([]);
    companyTags$ = companyTags$ || of([]);
    tagsFilterByProject$ = tagsFilterByProject$ || of(true);
    return combineLatest(
      [
        selected$,
        data$,
        showAllSelectedIsActive$,
        companyTags$,
        projectTags$,
        tagsFilterByProject$
      ]
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(100),
      filter(([selected, , showAllSelectedIsActive]) => selected.length > 1 || this.currentSelection?.length > 1 || showAllSelectedIsActive),
      tap(([selected]) => this.currentSelection = selected),
      map(([selected, data, showAllSelectedIsActive, companyTags, projectTags, tagsFilterByProject]) => {
          const _selectionAllHasExample = selectionAllHasExample(selected);
          const _selectionHasExample = selectionHasExample(selected);
          const _selectionExamplesCount = selectionExamplesCount(selected);
          const isArchive = this.inArchivedMode() ?? selectionAllIsArchive(selected);
          return {
            selectionHasExample: _selectionHasExample,
            selectionAllHasExample: _selectionAllHasExample,
            selectionIsOnlyExamples: _selectionExamplesCount.length === selected.length,
            selected,
            selectionAllIsArchive: isArchive,
            data,
            showAllSelectedIsActive,
            companyTags,
            projectTags,
            tagsFilterByProject
          };
        }
      ),
      filter(({selected, data}) => !!selected && !!data)
    );
  }

  archivedChanged(archived: boolean) {
    const navigate = () => this.closePanel({archive: archived || null}).then(() => {
      this.afterArchiveChanged();
      this.store.dispatch(resetProjectSelection());
    });
    this.store.select(selectNeverShowPopups)
      .pipe(
        take(1),
        switchMap(neverShow => {
          if (this.getSelectedEntities().length > 0 && !neverShow?.includes('go-to-archive')) {
            return this.dialog.open(ConfirmDialogComponent, {
              data: {
                title: 'Are you sure?',
                body: `Navigating between "Live" and "Archive" will deselect your selected ${this.entityType}s.`,
                yes: 'Proceed',
                no: 'Back',
                iconClass: 'al-ico-alert',
                conColor: 'var(--color-warning)',
                showNeverShowAgain: true
              }
            }).afterClosed();
          } else {
            navigate();
            return of(false);
          }
        })
      )
      .subscribe((confirmed) => {
        if (confirmed) {
          navigate();
          if (confirmed.neverShowAgain) {
            this.store.dispatch(neverShowPopupAgain({popupId: 'go-to-archive'}));
          }
        }
      });
  }

  filterSearchChanged({colId, value}: { colId: string; value: { value: string; loadMore?: boolean } }) {
    if (colId === 'project.name') {
      if ((this.projectId() || this.selectedProjectId) === '*') {
        this.store.dispatch(getTablesFilterProjectsOptions({
          searchString: value.value || '',
          loadMore: value.loadMore
        }));
      } else {
        this.store.dispatch(setTablesFilterProjectsOptions({
          projects: this.selectedProject() ? [this.selectedProject(),
            ...(this.selectedProject()?.sub_projects ?? [])] : [], scrollId: null
        }));
      }
    }
  }

  setupBreadcrumbsOptions() {}

  public setupContextMenu(entitiesType: string, archive: boolean) {
    this.contextMenuService.setupProjectContextMenu(entitiesType, this.selectedProjectId, archive);
  }

  cardsCollapsedToggle() {
    this.store.dispatch(toggleCardsCollapsed({entityType: this.entityType}));
  }
  resetTablesFilterOptions() {
    this.store.dispatch(resetTablesFilterProjectsOptions());
    this.store.dispatch(resetTablesFilterParentsOptions());
  }

}
