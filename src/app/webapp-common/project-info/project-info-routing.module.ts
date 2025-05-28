import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {ProjectInfoComponent} from './project-info.component';

export const routes: Routes = [
  {
    path     : '',
    component: ProjectInfoComponent,
    data: {search: false, archiveLabel: ''},
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class ProjectInfoRoutingModule {
}

