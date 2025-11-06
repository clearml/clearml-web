import {CommonModule} from '@angular/common';
import {NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {CommonProjectsModule} from '@common/projects/common-projects.module';
import {DatasetsRoutingModule} from '~/features/datasets/datasets-routing.module';
import {DatasetsSharedModule} from '~/features/datasets/shared/datasets-shared.module';
import {NestedDatasetsPageComponent} from '~/features/datasets/nested-datasets-page/nested-datasets-page.component';
import {ProjectsSharedModule} from '~/features/projects/shared/projects-shared.module';
import {ButtonToggleComponent} from '@common/shared/ui-components/inputs/button-toggle/button-toggle.component';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {PushPipe} from '@ngrx/component';
import {OpenDatasetsComponent} from '@common/datasets/open-datasets/open-datasets.component';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {DotsLoadMoreComponent} from '@common/shared/ui-components/indicators/dots-load-more/dots-load-more.component';
import {FormsModule} from '@angular/forms';


@NgModule({
  imports: [
    CommonModule,
    CommonProjectsModule,
    DatasetsRoutingModule,
    DatasetsSharedModule,
    NestedDatasetsPageComponent,
    ProjectsSharedModule,
    ButtonToggleComponent,
    ShowTooltipIfEllipsisDirective,
    PushPipe,
    MatButton,
    MatIcon,
    DotsLoadMoreComponent,
    FormsModule
  ],
  declarations: [
    OpenDatasetsComponent,
  ],
  schemas: [NO_ERRORS_SCHEMA],
  exports: []
})
export class DatasetsModule {
}

