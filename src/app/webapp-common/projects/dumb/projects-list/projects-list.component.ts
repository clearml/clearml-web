import {Component, computed, input, output, signal} from '@angular/core';
import {ProjectsGetAllResponseSingle} from '~/business-logic/model/projects/projectsGetAllResponseSingle';
import {Project} from '~/business-logic/model/projects/project';
import {isExample} from '@common/shared/utils/shared-utils';
import {pageSize} from '../../common-projects.consts';

@Component({
    selector: 'sm-projects-list',
    templateUrl: './projects-list.component.html',
    styleUrls: ['./projects-list.component.scss'],
    standalone: false
})
export class ProjectsListComponent {
  isExample = isExample;
  pageSize = pageSize;

  projects = input<Project[]>();
  noMoreProjects = input<boolean>();
  showLast = input<boolean>();
  projectCardClicked = output<ProjectsGetAllResponseSingle>();
  projectNameChanged = output<{
        id: string;
        name: string;
    }>();
  deleteProjectClicked = output<Project>();
  loadMore = output();
  moveToClicked = output<Project>();
  createNewProjectClicked = output<Project>();
  projectEditClicked = output<Project>();
  projectSettingsClicked = output<Project>();


  protected projectsNames = computed(() => this.projects()?.map(p => p.basename));
  protected totalVirtualCards = computed(() => this.projects()?.[1]?.['isRoot'] ? 2 : 1);
  protected projectsState = computed(() => ({
    projects: this.projects(),
    loading: signal(false)
  }))

  loadMoreAction() {
    this.projectsState().loading.set(true);
    this.loadMore.emit();
  }
}
