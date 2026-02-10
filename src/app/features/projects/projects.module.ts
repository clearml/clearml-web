import {NgModule} from '@angular/core';
import {ProjectRouterModule} from './projects-routing.module';
import {CommonProjectsModule} from '@common/projects/common-projects.module';
import {ProjectDialogModule} from '@common/shared/project-dialog/project-dialog.module';

export const projectSyncedKeys = ['showHidden', 'tableModeAwareness', 'orderBy', 'sortOrder'];

@NgModule({
  imports        : [
    ProjectRouterModule,
    CommonProjectsModule,
    ProjectDialogModule
  ],
  declarations   : []
})
export class ProjectsModule {
}
