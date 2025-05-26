import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {CommonProjectReadyForDeletion, selectNoMoreProjects, selectProjectReadyForDeletion, selectProjects, selectProjectsOrderBy, selectProjectsSortOrder} from '../../common-projects.reducer';
import {checkProjectForDeletion, getAllProjectsPageProjects, resetProjects, resetProjectsSearchQuery, resetReadyToDelete, setCurrentScrollId, setProjectsOrderBy, setProjectsSearchQuery, updateProject} from '../../common-projects.actions';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {ProjectsGetAllResponseSingle} from '~/business-logic/model/projects/projectsGetAllResponseSingle';
import {ProjectDialogComponent, ProjectDialogConfig} from '@common/shared/project-dialog/project-dialog.component';
import {combineLatest, Observable, Subscription} from 'rxjs';
import {debounceTime, distinctUntilKeyChanged, filter, map, skip, take, tap} from 'rxjs/operators';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import * as coreProjectsActions from '@common/core/actions/projects.actions';
import {setDeep, setSelectedProjectId} from '@common/core/actions/projects.actions';
import {initSearch, resetSearch} from '@common/common-search/common-search.actions';
import {SearchState, selectSearchQuery} from '@common/common-search/common-search.reducer';
import {getDeleteProjectPopupStatsBreakdown, isDeletableProject, popupEntitiesListConst, readyForDeletionFilter} from '~/features/projects/projects-page.utils';
import {selectRouterConfig} from '@common/core/reducers/router-reducer';
import {Project} from '~/business-logic/model/projects/project';
import {CommonDeleteDialogComponent, DeleteData} from '@common/shared/entity-page/entity-delete/common-delete-dialog.component';
import {resetDeleteState} from '@common/shared/entity-page/entity-delete/common-delete-dialog.actions';
import {isExample} from '@common/shared/utils/shared-utils';
import {selectRouterProjectId, selectSelectedProject} from '@common/core/reducers/projects.reducer';
import {selectActiveWorkspaceReady} from '~/core/reducers/view.reducer';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {concatLatestFrom} from '@ngrx/operators';
import {selectShowOnlyUserWork} from '@common/core/reducers/users-reducer';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {ProjectSettingsDialogComponent, ProjectSettingsDialogConfig} from '@common/shared/project-dialog/project-settings/project-settings-dialog.component';
import {ProjectSettingsDialog} from '@common/projects/common-projects.consts';
import {setExperimentMetricsSearchTerm} from '@common/experiments/actions/common-experiment-output.actions';

@Component({
  selector: 'sm-common-projects-page',
  templateUrl: './common-projects-page.component.html',
  styleUrls: ['./common-projects-page.component.scss'],
  standalone: false
})
export class CommonProjectsPageComponent implements OnInit, OnDestroy {
  public projectsList$: Observable<Project[]>;
  public projectsOrderBy$: Observable<string>;


  public ALL_EXPERIMENTS_CARD: ProjectsGetAllResponseSingle = {
    id: '*',
    name: 'All Tasks',
    stats: {
      active: {
        status_count: {queued: '∞' as any, in_progress: '∞' as any, published: '∞' as any},
        total_runtime: 0
      }
    }
  };

  public ROOT_EXPERIMENTS_CARD: ProjectsGetAllResponseSingle = {
    name: '[.]',
    stats: {
      active: {
        status_count: {queued: 0, in_progress: 0, closed: 0},
        total_runtime: 0
      }
    }
  };
  public noMoreProjects$: Observable<boolean>;
  public projectsSortOrder$: Observable<1 | -1>;
  public searching: boolean;
  public selectedProjectId$: Observable<string>;
  public allExamples: boolean;

  protected readonly searchQuery$: Observable<SearchState['searchQuery']>;
  public selectedProject$: Observable<Project>;
  public projectId: string;
  public subs = new Subscription();
  private selectedProject: Project;
  protected store = inject(Store);
  protected router = inject(Router);
  protected route = inject(ActivatedRoute);
  protected dialog = inject(MatDialog);
  public loading: boolean;

  constructor() {
    this.searchQuery$ = this.store.select(selectSearchQuery);
    this.projectsOrderBy$ = this.store.select(selectProjectsOrderBy);
    this.projectsSortOrder$ = this.store.select(selectProjectsSortOrder);
    this.noMoreProjects$ = this.store.select(selectNoMoreProjects);
    this.selectedProjectId$ = this.store.select(selectRouterProjectId);
    this.selectedProject$ = this.store.select(selectSelectedProject).pipe(tap(selectedProject => this.selectedProject = selectedProject));

    this.projectsList$ = combineLatest([
      this.store.select(selectProjects),
      this.store.select(selectSelectedProject)
    ]).pipe(
      debounceTime(50),
      concatLatestFrom(() => [this.selectedProjectId$, this.searchQuery$, this.store.select(selectRouterConfig)]),
      map(([[projectsList, selectedProject = {} as Project], selectedProjectId, searchQuery, config]) => {
        this.loading = false;
        this.searching = searchQuery?.query.length > 0;
        this.allExamples = projectsList?.length > 0 && projectsList?.every(project => isExample(project));
        if (!projectsList) {
          return projectsList;
        }
        if ((searchQuery?.query || searchQuery?.regExp)) {
          return projectsList;
        } else {
          if ((selectedProject?.sub_projects?.length === 0 || this.shouldReRoute(selectedProject, config)) && selectedProjectId === selectedProject?.id) {
            this.noProjectsReRoute();
            return [];
          }
          const pageProjectsList = this.getExtraProjects(selectedProjectId, selectedProject);
          return pageProjectsList.concat(projectsList);
        }
      })
    );
    this.syncAppSearch();
  }

  noProjectsReRoute() {
    return this.router.navigate(['..', 'tasks'], {relativeTo: this.route.parent});
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldReRoute(selectedProject, config) {
    return false;
  }

  protected getExtraProjects(selectedProjectId, selectedProject) {
    return [{
      ...((selectedProjectId && selectedProject?.id) ? selectedProject : this.ALL_EXPERIMENTS_CARD),

      id: selectedProjectId ? selectedProjectId : '*',
      name: 'All Tasks',
      basename: 'All Tasks',

      sub_projects: null
    } as ProjectsGetAllResponseSingle];
  }

  ngOnInit() {
    this.store.dispatch(resetProjects());
    this.store.dispatch(setDeep({deep: false}));
    // Todo: join the 2 subscriptions to 1 selector.
    this.subs.add(this.store.select(selectActiveWorkspaceReady)
      .pipe(filter(ready => !!ready), take(1))
      .subscribe(() => this.store.dispatch(getAllProjectsPageProjects())));

    this.subs.add(this.selectedProjectId$.pipe(
    ).subscribe((projectId) => {
        this.projectId = projectId;
      }
    ));

    this.subs.add(this.selectedProject$.pipe(
      filter(project => (!!project)),
      distinctUntilKeyChanged('id'),
      skip(1)
    ).subscribe(() => {
      this.store.dispatch(setCurrentScrollId({scrollId: null}));
      this.store.dispatch(getAllProjectsPageProjects());
    }));
    this.subs.add(this.store.select(selectShowOnlyUserWork)
      .pipe(skip(1))
      .subscribe(() => {
        this.store.dispatch(resetProjects());
        this.store.dispatch(getAllProjectsPageProjects());
      }));

    this.subs.add(this.store.select(selectProjectReadyForDeletion)
      .pipe(
        filter(readyForDeletion => readyForDeletion !== null && readyForDeletionFilter(readyForDeletion))
      )
      .subscribe(readyForDeletion => {
        if (isDeletableProject(readyForDeletion)) {
          this.showDeleteDialog(readyForDeletion);
        } else {
          this.showConfirmDialog(readyForDeletion);
        }
      })
    );
    this.setupBreadcrumbsOptions();
  }

  protected getDeletePopupEntitiesList() {
    return 'task';
  }

  setupBreadcrumbsOptions() {
    this.subs.add(this.selectedProject$.pipe().subscribe((selectedProject) => {
      this.store.dispatch(coreProjectsActions.setBreadcrumbsOptions({
        breadcrumbOptions: {
          showProjects: !!selectedProject,
          featureBreadcrumb: {
            name: 'PROJECTS',
            url: 'projects'
          },
          projectsOptions: {
            basePath: 'projects',
            filterBaseNameWith: null,
            compareModule: null,
            showSelectedProject: true,
            ...(selectedProject && {selectedProjectBreadcrumb: {name: selectedProject?.basename}})
          }
        }
      }));
    }));
  }

  private showConfirmDialog(readyForDeletion: CommonProjectReadyForDeletion) {
    const name = this.getName();
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {
      data: {
        title: `Unable to Delete ${name[0].toUpperCase()}${name.slice(1)}`,
        body: `You cannot delete ${name} "<b>${readyForDeletion.project.name.split('/').pop()}</b>" with un-archived ${name === 'project' ? popupEntitiesListConst : this.getDeletePopupEntitiesList()}s. <br/>
                   You have ${getDeleteProjectPopupStatsBreakdown(
          readyForDeletion,
          'unarchived',
          `un-archived ${this.getDeletePopupEntitiesList()}`
        )} in this ${name}. <br/>
                   If you wish to delete this ${name}, you must first archive${name === 'project' ? `, delete, or move these items to another ${name}` : ' or delete these items'} .`,
        no: 'OK',
        iconClass: 'al-ico-alert',
        iconColor: 'var(--color-warning)'
      }
    }).afterClosed()
      .subscribe(() => {
        this.store.dispatch(resetReadyToDelete());
      });
  }

  private showDeleteDialog(readyForDeletion) {
    this.dialog.open<CommonDeleteDialogComponent, DeleteData, boolean>(CommonDeleteDialogComponent, {
      data: {
        entity: readyForDeletion.project,
        numSelected: 1,
        entityType: this.getName(),
        projectStats: readyForDeletion
      },
      width: '600px',
      disableClose: true
    }).afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.store.dispatch(resetProjects());
          this.store.dispatch(getAllProjectsPageProjects());
        }
        this.store.dispatch(resetDeleteState());
      });
  }

  ngOnDestroy() {
    this.stopSyncSearch();
    this.subs.unsubscribe();
    this.store.dispatch(resetReadyToDelete());
    this.store.dispatch(resetProjectsSearchQuery());
    this.store.dispatch(resetProjects());
  }

  stopSyncSearch() {
    this.store.dispatch(resetSearch());
  }


  syncAppSearch() {
    this.store.dispatch(initSearch({payload: `Search for ${this.getName()}s`}));
    this.subs.add(this.searchQuery$.pipe(take(1)).subscribe(query =>
      this.store.dispatch(setProjectsSearchQuery({...query, skipGetAll: true}))));
    this.subs.add(this.searchQuery$.pipe(skip(1),filter(query => query !== null)).subscribe(query => this.search(query)));
  }

  public projectCardClicked(project: ProjectsGetAllResponseSingle) {
    const allExperiments = project.name === 'All Tasks';
    if (allExperiments) {
      this.store.dispatch(setDeep({deep: true}));
    }
    this.router.navigate(project?.sub_projects?.length > 0 ? [project.id, 'projects'] : [project.id],
      {relativeTo: this.projectId ? this.route.parent.parent.parent : this.route});
    this.store.dispatch(setSelectedProjectId({projectId: project.id, example: isExample(project)}));
  }

  search(query: SearchState['searchQuery']) {
    this.store.dispatch(setProjectsSearchQuery(query));
  }

  orderByChanged(sortByFieldName: string) {
    this.store.dispatch(setProjectsOrderBy({orderBy: sortByFieldName}));
  }

  projectNameChanged(updatedProject: { id: string; name: string }) {
    this.store.dispatch(updateProject({id: updatedProject.id, changes: {name: updatedProject.name}}));
  }

  deleteProject(project: Project) {
    this.store.dispatch(checkProjectForDeletion({project}));
  }

  loadMore() {
    this.loading = true;
    this.store.dispatch(getAllProjectsPageProjects());
  }


  openProjectDialog(mode?: string, project?: Project) {
    this.dialog.open<ProjectDialogComponent, ProjectDialogConfig, boolean>(ProjectDialogComponent, {
      data: {
        mode,
        project: project ?? this.selectedProject
      }
    }).afterClosed()
      .pipe(filter(projectHasBeenUpdated => projectHasBeenUpdated))
      .subscribe(() => {
        this.store.dispatch(resetProjectsSearchQuery());
        this.store.dispatch(getAllProjectsPageProjects());
        this.store.dispatch(coreProjectsActions.getAllSystemProjects());
      });
  }

  openProjectSettings(project: Project) {
    this.dialog.open<ProjectSettingsDialogComponent, ProjectSettingsDialogConfig, ProjectSettingsDialog>(ProjectSettingsDialogComponent, {
      data: {
        project: project ?? this.selectedProject
      },
      width: '760px',
    }).afterClosed()
      .subscribe((confirmed) => {
        this.store.dispatch(setExperimentMetricsSearchTerm({searchTerm: ''}));
        if (confirmed) {
          this.store.dispatch(resetProjects());
          this.store.dispatch(getAllProjectsPageProjects());
        }
      });
  }

  protected getName() {
    return EntityTypeEnum.project;
  }
}
