import {Component, input, TemplateRef, output, signal, computed} from '@angular/core';
import {Project} from '~/business-logic/model/projects/project';
import {isExample} from '@common/shared/utils/shared-utils';

export enum ProjectTypeEnum {
  pipelines = 'pipelines',
  datasets = 'datasets',
  hyperDatasets = 'hyperdatasets',
  reports = 'reports',
}

@Component({
    selector: 'sm-nested-project-view-page',
    templateUrl: './nested-project-view-page.component.html',
    styleUrls: ['./nested-project-view-page.component.scss'],
    standalone: false
})
export class NestedProjectViewPageComponent {
  isExample = isExample;
  totalVirtualCards = input(0);
  entityType = input<ProjectTypeEnum>();
  projectsList = input<Project[]>();
  allExamples = input<boolean>();
  showExamples = input<boolean>();
  searching = input<boolean>();
  projectsOrderBy = input<any>();
  projectsSortOrder = input<any>();
  projectsTags = input<string[]>();
  noMoreProjects = input<boolean>();
  cardContentTemplateRef = input<TemplateRef<unknown>>();
  cardContentFooterTemplateRef = input<TemplateRef<{
        $implicit: Project;
    }>>();
  cardClicked = output<{
        hasSubProjects: boolean;
        id: string;
        name: string;
    }>();
  toggleNestedView = output<boolean>();
  orderByChanged = output<string>();
  projectNameChanged = output<{
        id: string;
        name: string;
    }>();
  deleteProjectClicked = output<Project>();
  removeTag = output<{
        project: Project;
        tag: string;
    }>();
  loadMore = output();
  protected projectsState = computed(() => ({
    projects: this.projectsList(),
    loading: signal(false)
  }))

  loadMoreAction() {
    this.projectsState().loading.set(true);
    this.loadMore.emit();
  }
}
