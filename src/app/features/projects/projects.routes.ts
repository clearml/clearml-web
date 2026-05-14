import {Routes} from '@angular/router';
import {CrumbTypeEnum} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {commonProjectsProviders} from '@common/projects/common-projects.providers';
import {projectDialogProviders} from '@common/shared/project-dialog/project-dialog.providers';

export const projectSyncedKeys = ['showHidden', 'tableModeAwareness', 'orderBy', 'sortOrder'];

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@common/projects/containers/projects-page/projects-page.component').then(c => c.ProjectsPageComponent),
    data: {
      staticBreadcrumb: [[{
        name: 'PROJECTS',
        type: CrumbTypeEnum.Feature
      }]]
    },
    providers: [
      ...commonProjectsProviders,
      ...projectDialogProviders,
    ]
  }
];
