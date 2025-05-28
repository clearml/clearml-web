import {Component, OnDestroy, OnInit} from '@angular/core';
import {pageSize} from '@common/projects/common-projects.consts';
import {CommonProjectsPageComponent} from '@common/projects/containers/projects-page/common-projects-page.component';
import {isExample} from '@common/shared/utils/shared-utils';
import {
  addProjectTags,
  getProjectsTags, setBreadcrumbsOptions,
  setDefaultNestedModeForFeature,
  setSelectedProjectId,
  setTags
} from '@common/core/actions/projects.actions';
import {
  selectDefaultNestedModeForFeature,
  selectMainPageTagsFilter,
  selectMainPageTagsFilterMatchMode,
  selectProjectTags
} from '@common/core/reducers/projects.reducer';
import {combineLatest, Observable, Subscription} from 'rxjs';
import {Project} from '~/business-logic/model/projects/project';
import {
  getAllProjectsPageProjects,
  resetProjects,
  showExamplePipelines,
  updateProject
} from '@common/projects/common-projects.actions';
import {ProjectsGetAllResponseSingle} from '~/business-logic/model/projects/projectsGetAllResponseSingle';
import {selectShowPipelineExamples} from '@common/projects/common-projects.reducer';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {
  PipelinesEmptyStateComponent
} from '@common/pipelines/pipelines-page/pipelines-empty-state/pipelines-empty-state.component';
import {debounceTime, skip, withLatestFrom} from 'rxjs/operators';
import {ProjectTypeEnum} from '@common/nested-project-view/nested-project-view-page/nested-project-view-page.component';

@Component({
    selector: 'sm-pipelines-page',
    templateUrl: './pipelines-page.component.html',
    styleUrls: ['./pipelines-page.component.scss'],
    standalone: false
})
export class PipelinesPageComponent extends CommonProjectsPageComponent implements OnInit, OnDestroy {
  initPipelineCode = `from clearml import PipelineDecorator

@PipelineDecorator.component(cache=True, execution_queue="default")
def step(size: int):
    import numpy as np
    return np.random.random(size=size)

@PipelineDecorator.pipeline(
    name='ingest',
    project='data processing',
    version='0.1'
)
def pipeline_logic(do_stuff: bool):
    if do_stuff:
        return step(size=42)

if __name__ == '__main__':
    # run the pipeline on the current machine, for local debugging
    # for scale-out, comment-out the following line (Make sure a
    # 'services' queue is available and serviced by a ClearML agent
    # running either in services mode or through K8S/Autoscaler)
    PipelineDecorator.run_locally()

    pipeline_logic(do_stuff=True)`;

  pageSize = pageSize;
  protected entityType = ProjectTypeEnum.pipelines;
  isExample = isExample;
  public projectsTags$: Observable<string[]>;
  public showExamples$: Observable<boolean>;
  private headerUserFocusSub: Subscription;
  private mainPageFilterSub: Subscription;
  public isNested$: Observable<boolean>;

  override ngOnInit() {
    super.ngOnInit();
    this.store.dispatch(getProjectsTags({entity: this.getName()}));
    this.showExamples$ = this.store.select(selectShowPipelineExamples);
    this.projectsTags$ = this.store.select(selectProjectTags);
    this.mainPageFilterSub = combineLatest([
      this.store.select(selectMainPageTagsFilter),
      this.store.select(selectMainPageTagsFilterMatchMode)
    ]).pipe(debounceTime(0), skip(1))
      .subscribe(() => {
        this.store.dispatch(resetProjects());
        this.store.dispatch(getAllProjectsPageProjects());
      });

  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.headerUserFocusSub?.unsubscribe();
    this.mainPageFilterSub.unsubscribe();
    this.store.dispatch(setTags({tags: []}));
  }

  addTag(project: Project, newTag: string) {
    const tags = [...project.tags, newTag];
    this.store.dispatch(updateProject({id: project.id, changes: {tags}}));
    this.store.dispatch(addProjectTags({tags: [newTag], systemTags: []}));
  }

  removeTag(project: Project, deleteTag: string) {
    const tags = project.tags?.filter(tag => tag != deleteTag);
    this.store.dispatch(updateProject({id: project.id, changes: {tags}}));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override getExtraProjects(selectedProjectId, selectedProject) {
    return [];
  }

  public override projectCardClicked(project: ProjectsGetAllResponseSingle) {
    this.router.navigate([project.id, 'tasks'], {relativeTo: this.projectId ? this.route.parent.parent.parent : this.route});
    this.store.dispatch(setSelectedProjectId({projectId: project.id, example: isExample(project)}));
  }

  protected override getName() {
    return EntityTypeEnum.pipeline;
  }

  protected override getDeletePopupEntitiesList() {
    return 'run';
  }

  createPipeline() {
    this.dialog.open(PipelinesEmptyStateComponent, {
      data: {
        pipelineCode: this.initPipelineCode
      },
      width: '1248px'
    });

  }

  createExamples() {
    this.store.dispatch(showExamplePipelines());
  }

  override shouldReRoute(selectedProject, config) {
    const relevantSubProjects = selectedProject?.sub_projects?.filter(proj => proj.name.includes('.pipelines'));
    return config[2] === 'projects' && selectedProject.id !== '*' && (relevantSubProjects?.every(subProject => subProject.name.startsWith(selectedProject.name + '/.')));
  }

  override noProjectsReRoute() {
    return this.router.navigate(['..', 'pipelines'], {relativeTo: this.route});
  }

  toggleNestedView(nested: boolean) {
    this.store.dispatch(setDefaultNestedModeForFeature({feature: 'pipelines', isNested: nested}));

    if (nested) {
      this.router.navigate(['*', 'projects'], {relativeTo: this.route});
    } else {
      this.router.navigateByUrl('pipelines');
    }
  }

  override setupBreadcrumbsOptions() {
    this.subs.add(this.selectedProject$.pipe(
      withLatestFrom(this.store.select(selectDefaultNestedModeForFeature))
    ).subscribe(([selectedProject, defaultNestedModeForFeature]) => {
      this.store.dispatch(setBreadcrumbsOptions({
        breadcrumbOptions: {
          showProjects: !!selectedProject,
          featureBreadcrumb: {
            name: 'PIPELINES',
            url: defaultNestedModeForFeature['pipelines'] ? 'pipelines/*/projects' : 'pipelines'
          },
          projectsOptions: {
            basePath: 'pipelines',
            filterBaseNameWith: ['.pipelines'],
            compareModule: null,
            showSelectedProject: selectedProject?.id !== '*',
            ...(selectedProject && selectedProject?.id !== '*' && {selectedProjectBreadcrumb: {name: selectedProject?.basename}})
          }
        }
      }));
    }));
  }
}
