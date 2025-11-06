import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {ProjectsPageComponent} from '@common/projects/containers/projects-page/projects-page.component';
import {CrumbTypeEnum} from '@common/layout/breadcrumbs/breadcrumbs.component';

export const routes: Routes = [
  {path: '', component: ProjectsPageComponent, data: {
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

