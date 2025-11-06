import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ProjectRouterModule} from './projects-routing.module';
import {CommonProjectsModule} from '@common/projects/common-projects.module';

export const projectSyncedKeys = ['showHidden', 'tableModeAwareness', 'orderBy', 'sortOrder'];

@NgModule({
  imports        : [
    CommonModule,
    ProjectRouterModule,
    CommonProjectsModule,
  ],
  declarations   : []
})
export class ProjectsModule {
}
