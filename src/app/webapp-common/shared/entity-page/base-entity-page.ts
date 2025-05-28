import {AfterViewInit, Component, inject, OnDestroy, OnInit, ViewChild, viewChildren} from '@angular/core';
import {ActionCreator, Store} from '@ngrx/store';
import {combineLatest, Observable, of, Subject, Subscription, switchMap} from 'rxjs';
import {debounceTime,distinctUntilChanged, filter, map, take, takeUntil, tap, throttleTime, withLatestFrom} from 'rxjs/operators';
import {Project} from '~/business-logic/model/projects/project';
import {
  selectIsArchivedMode,
  selectSelectedProject,
  selectSelectedProjectUsers,
  selectTablesFilterProjectsOptions
} from '../../core/reducers/projects.reducer';
import {SplitAreaComponent, SplitComponent, SplitGutterInteractionEvent} from 'angular-split';
import {selectRouterParams} from '../../core/reducers/router-reducer';
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
  resetProjectSelection,
  setTablesFilterProjectsOptions
} from '@common/core/actions/projects.actions';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {RefreshService} from '@common/core/services/refresh.service';
import {selectTableModeAwareness} from '@common/projects/common-projects.reducer';
import {setTableModeAwareness} from '@common/projects/common-projects.actions';
import {User} from '~/business-logic/model/users/user';
import {neverShowPopupAgain, toggleCardsCollapsed} from '../../core/actions/layout.actions';
import {selectNeverShowPopups, selectTableCardsCollapsed} from '../../core/reducers/view.reducer';
import {isReadOnly} from '@common/shared/utils/is-read-only';
import {setCustomMetrics} from '@common/models/actions/models-view.actions';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import {HeaderMenuService} from '@common/shared/services/header-menu.service';
import {selectProjectId} from '@common/models/reducers';

@Component({
    selector: 'sm-base-entity-page',
    template: '',
    standalone: false
})
export abstract class BaseEntityPageComponent implements OnInit, AfterViewInit, OnDestroy {
  protected entities = [];
  protected entityType: EntityTypeEnum;
  public selectedProject$: Observable<Project>;
  protected setSplitSizeAction: ActionCreator<string, any>;
  protected addTag: ActionCreator<string, any>;
  protected abstract setTableModeAction: ActionCreator<string, any>;
  public shouldOpenDetails = false;
  protected sub = new Subscription();
  public checkedExperiments: IExperimentInfo[];
  public projectId: string;
  public isExampleProject: boolean;
  protected selectSplitSize$?: Observable<number>;
  public infoDisabled: boolean;
  public splitInitialSize: number;
  public minimizedView: boolean;
  public footerItems = [] as ItemFooterModel[];
  public footerState$: Observable<IFooterState<{id: string}>>;
  public tableModeAwareness$: Observable<boolean>;
  private tableModeAwareness: boolean;
  private destroy$ = new Subject();
  public users$: Observable<User[]>;
  public projectsOptions$: Observable<Project[]>;
  protected parents = [];
  // public compareViewMode: 'scalars' | 'plots';

  @ViewChild('split') split: SplitComponent;
  splitAreas = viewChildren(SplitAreaComponent);
  protected abstract inEditMode$: Observable<boolean>;
  public selectedProject: Project;
  private currentSelection: { id: string }[];
  protected showAllSelectedIsActive$: Observable<boolean>;
  private allProjects: boolean;
  public cardsCollapsed$: Observable<boolean>;
  protected minimizedView$: Observable<boolean>;

  abstract onFooterHandler({emitValue, item}): void;

  abstract getSelectedEntities();

  abstract afterArchiveChanged();

  protected abstract getParamId(params);

  abstract refreshList(auto: boolean);


  get selectedProjectId() {
    return this.route.parent.snapshot.params.projectId;
  }

  protected store = inject(Store);
  protected route = inject(ActivatedRoute);
  protected router = inject(Router);
  protected dialog = inject(MatDialog);
  protected refresh = inject(RefreshService);
  protected contextMenuService = inject(HeaderMenuService);

  protected projectId$ = this.store.selectSignal(selectProjectId);
  protected isArchivedMode = this.store.selectSignal(selectIsArchivedMode);
  protected constructor() {

    this.users$ = this.store.select(selectSelectedProjectUsers);
    this.sub.add(this.store.select(selectSelectedProject).pipe(filter(p => !!p)).subscribe((project: Project) => {
      this.selectedProject = project;
      this.allProjects = project?.id === '*';
      this.isExampleProject = isReadOnly(project);
    }));
    this.projectsOptions$ = this.store.select(selectTablesFilterProjectsOptions);

    this.minimizedView$ = this.store.select(selectRouterParams).pipe(
      map(params => !!this.getParamId(params) || Object.hasOwn(params, 'ids'))
    );
    this.tableModeAwareness$ = this.store.select(selectTableModeAwareness)
      .pipe(
        filter(featuresAwareness => featuresAwareness !== null && featuresAwareness !== undefined),
        tap(aware => this.tableModeAwareness = aware)
      );

  }

  ngOnInit() {
    this.cardsCollapsed$ = this.store.select(selectTableCardsCollapsed(this.entityType)).pipe(distinctUntilChanged());
    this.selectedProject$ = this.store.select(selectSelectedProject);
    this.selectSplitSize$?.pipe(filter(x => !!x), take(1))
      .subscribe(x => this.splitInitialSize = x);

    this.sub.add(this.minimizedView$.subscribe( minimized => {
        if (this.split && this.minimizedView === true && !minimized) {
          this.splitInitialSize = this.splitAreas()[1].size() as number;
        }
        this.minimizedView = minimized;
      }
    ));

    this.sub.add(this.refresh.tick
      .pipe(
        withLatestFrom(this.inEditMode$, this.showAllSelectedIsActive$),
        filter(([tick, edit, showAllSelectedIsActive]) => !tick && !edit && !showAllSelectedIsActive),
        map(([auto]) => auto)
      )
      .subscribe(auto => this.refreshList(auto !== false))
    );
    this.setupBreadcrumbsOptions();
  }

  ngAfterViewInit() {
    if (this.setSplitSizeAction) {
      this.sub.add(this.split.dragProgress$.pipe(throttleTime(100))
        .subscribe((progress) => this.store.dispatch(this.setSplitSizeAction({splitSize: progress.sizes[1] as number})))
      );
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.footerItems = [];
    this.store.dispatch(setCustomMetrics({metrics: null}));
    this.destroy$.next(null);
    this.destroy$.complete();
  }

  closePanel(queryParams?: Params) {
    window.setTimeout(() => this.infoDisabled = false);
    this.store.dispatch(this.setTableModeAction({mode: 'table'}));
    return this.router.navigate(this.minimizedView ? [{}] : [], {
      relativeTo: this.route,
      queryParamsHandling: 'merge',
      queryParams
    });
  }

  protected compareView() {
    this.router.navigate(['compare'], {relativeTo: this.route, queryParamsHandling: 'preserve'});
  }

  splitSizeChange(event: SplitGutterInteractionEvent) {
    if (this.setSplitSizeAction) {
      this.store.dispatch(this.setSplitSizeAction({splitSize: event.sizes[1] as number}));
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
      this.allProjects ? of(null) : config.companyTags$,
      this.allProjects ? config.companyTags$ : config.projectTags$,
      this.allProjects ? of(true) : config.tagsFilterByProject$
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
      takeUntil(this.destroy$),
      debounceTime(100),
      filter(([selected, , showAllSelectedIsActive]) => selected.length > 1 || this.currentSelection?.length > 1 || showAllSelectedIsActive),
      tap(([selected]) => this.currentSelection = selected),
      map(([selected, data, showAllSelectedIsActive, companyTags, projectTags, tagsFilterByProject]) => {
          const _selectionAllHasExample = selectionAllHasExample(selected);
          const _selectionHasExample = selectionHasExample(selected);
          const _selectionExamplesCount = selectionExamplesCount(selected);
          const isArchive = this.isArchivedMode() ?? selectionAllIsArchive(selected);
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

  archivedChanged(isArchived: boolean) {
    const navigate = () => this.closePanel({archive: isArchived || null}).then(() => {
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
      if ((this.projectId || this.selectedProjectId) === '*') {
        this.store.dispatch(getTablesFilterProjectsOptions({
          searchString: value.value || '',
          loadMore: value.loadMore
        }));
      } else {
        this.store.dispatch(setTablesFilterProjectsOptions({
          projects: this.selectedProject ? [this.selectedProject,
            ...(this.selectedProject?.sub_projects ?? [])] : [], scrollId: null
        }));
      }
    }
  }

  public setupBreadcrumbsOptions() {
  }

  public setupContextMenu(entitiesType) {
    this.contextMenuService.setupProjectContextMenu(entitiesType, this.projectId);
  }

  cardsCollapsedToggle() {
    this.store.dispatch(toggleCardsCollapsed({entityType: this.entityType}))
  }
}
