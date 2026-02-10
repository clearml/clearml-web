import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  NestedProjectViewPageComponent,
  ProjectTypeEnum
} from '@common/nested-project-view/nested-project-view-page/nested-project-view-page.component';
import {CircleTypeEnum} from '~/shared/constants/non-common-consts';
import {ProjectsPageComponent} from '@common/projects/containers/projects-page/projects-page.component';
import {DatasetEmptyComponent} from '@common/datasets/dataset-empty/dataset-empty.component';
import {
  getProjectsTags,
  setBreadcrumbsOptions,
  setDefaultNestedModeForFeature,
  setTags
} from '@common/core/actions/projects.actions';
import {
  selectDefaultNestedModeForFeature,
  selectMainPageTagsFilter,
  selectMainPageTagsFilterMatchMode,
} from '@common/core/reducers/projects.reducer';
import {combineLatest, Subscription} from 'rxjs';
import {debounceTime, skip, withLatestFrom} from 'rxjs/operators';
import {getAllProjectsPageProjects, resetProjects} from '@common/projects/common-projects.actions';
import {CircleCounterComponent} from '@common/shared/ui-components/indicators/circle-counter/circle-counter.component';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {TagListComponent} from '@common/shared/ui-components/tags/tag-list/tag-list.component';
import {PushPipe} from '@ngrx/component';
import {MatIcon} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';

@Component({
    selector: 'sm-nested-open-datasets-page',
    templateUrl: './nested-open-datasets-page.component.html',
    styleUrls: ['../../../webapp-common/nested-project-view/nested-project-view-page/nested-project-view-page.component.scss'],
  imports: [
    CircleCounterComponent,
    ClickStopPropagationDirective,
    TagListComponent,
    PushPipe,
    MatIcon,
    MatButton,
    DatasetEmptyComponent,
    NestedProjectViewPageComponent
  ]
})
export class NestedOpenDatasetsPageComponent extends ProjectsPageComponent implements OnInit, OnDestroy {
  entityTypeEnum = ProjectTypeEnum;
  circleTypeEnum = CircleTypeEnum;
  hideMenu = false;
  entityType = ProjectTypeEnum.datasets;
  private mainPageFilterSub: Subscription;

  override projectCardClicked(data: { hasSubProjects: boolean; id: string; name: string }) {
    if (data.hasSubProjects) {
      this.router.navigate(['simple', data.id, 'projects'], {relativeTo: this.route.parent?.parent});
    } else {
      this.router.navigate(['simple', data.id, ProjectTypeEnum.datasets], {relativeTo: this.route.parent?.parent});
    }
  }

  createExamples() {
    this.dialog.open(DatasetEmptyComponent, {
      maxWidth: '95vw',
      width: '1248px'
    });
  }

  toggleNestedView(nested: boolean) {
    this.store.dispatch(setDefaultNestedModeForFeature({feature: this.entityType, isNested: nested}));
    if (!nested) {
      this.router.navigateByUrl(this.entityType);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override getExtraProjects(selectedProjectId, selectedProject) {
    return [];
  }

  ngOnInit() {
    // Todo: 1 subscription at base, get function to supply relevant selectors
    this.mainPageFilterSub = combineLatest([
      this.store.select(selectMainPageTagsFilter),
      this.store.select(selectMainPageTagsFilterMatchMode)
    ]).pipe(debounceTime(0), skip(1))
      .subscribe(() => {
        this.store.dispatch(resetProjects());
        this.store.dispatch(getAllProjectsPageProjects());
      });
  }
  override noProjectsReRoute() {
    return this.router.navigate(['..', 'datasets'], {relativeTo: this.route});
  }

  override shouldReRoute(selectedProject, config) {
    const relevantSubProjects = selectedProject?.sub_projects?.filter(proj => proj.name.includes('.datasets'));
    return config[3] === 'projects' && selectedProject.id !== '*' && (relevantSubProjects?.every(subProject => subProject.name.startsWith(selectedProject.name + '/.')));
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.subs.unsubscribe();
    this.mainPageFilterSub.unsubscribe();
    this.store.dispatch(setTags({tags: []}));
  }

  override setupBreadcrumbsOptions() {
    this.subs.add(this.selectedProject$.pipe(
      withLatestFrom(this.store.select(selectDefaultNestedModeForFeature))
    ).subscribe(([selectedProject, defaultNestedModeForFeature]) => {
      this.store.dispatch(setBreadcrumbsOptions({
        breadcrumbOptions: {
          showProjects: !!selectedProject,
          featureBreadcrumb: {
            name: 'DATASETS',
            url: defaultNestedModeForFeature['datasets'] ? 'datasets/simple/*/projects' : 'datasets'
          },
          projectsOptions: {
            basePath: 'datasets/simple',
            filterBaseNameWith: ['.datasets'],
            compareModule: null,
            showSelectedProject: selectedProject?.id !== '*',
            ...(selectedProject && selectedProject?.id !== '*' && {selectedProjectBreadcrumb: {name: selectedProject?.basename}})
          }
        }
      }));
    }));
  }

  override  getProjectsTags(){
    this.store.dispatch(getProjectsTags({entity: 'dataset', projectId: this.projectId}));
  }
}
