import {NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {CommonProjectsModule} from '@common/projects/common-projects.module';
import {DatasetsRoutingModule} from '~/features/datasets/datasets-routing.module';


@NgModule({
  imports: [
    CommonProjectsModule,
    DatasetsRoutingModule,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class DatasetsModule {
}

