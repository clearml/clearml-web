import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {CrumbTypeEnum} from '@common/layout/breadcrumbs/breadcrumbs.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@common/projects/containers/projects-page/projects-page.component').then(c => c.ProjectsPageComponent),
    data: {
      staticBreadcrumb: [[{
        name: 'PROJECTS',
        type: CrumbTypeEnum.Feature
      }]]
    }}
];


@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class ProjectRouterModule {
}

