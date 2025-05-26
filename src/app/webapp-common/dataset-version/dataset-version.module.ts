import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {
  OpenDatasetVersionsComponent
} from '@common/dataset-version/open-dataset-versions/open-dataset-versions.component';
import {
  OpenDatasetVersionInfoComponent
} from '@common/dataset-version/open-dataset-version-info/open-dataset-version-info.component';
import {
  OpenDatasetVersionMenuComponent
} from '@common/dataset-version/open-dataset-version-menu/open-dataset-version-menu.component';
import {
  OpenDatasetVersionDetailsComponent
} from '@common/dataset-version/open-dataset-version-details/open-dataset-version-details.component';
import {
  OpenDatasetVersionPreviewComponent
} from '@common/dataset-version/open-dataset-version-preview/open-dataset-version-preview.component';
import {ExperimentSharedModule} from '~/features/experiments/shared/experiment-shared.module';
import {ExperimentCompareSharedModule} from '@common/experiments-compare/shared/experiment-compare-shared.module';
import {ExperimentOutputLogModule} from '@common/experiments/shared/experiment-output-log/experiment-output-log.module';
import {DebugImagesModule} from '@common/debug-images/debug-images.module';
import {AngularSplitModule} from 'angular-split';
import {DatasetVersionStepComponent} from '@common/dataset-version/dataset-version-step/dataset-version-step.component';
import {HesitateDirective} from '@common/shared/ui-components/directives/hesitate.directive';
import {UniqueByPipe} from '@common/shared/pipes/unique-by.pipe';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {ReplaceViaMapPipe} from '@common/shared/pipes/replaceViaMap';
import {MenuItemTextPipe} from '@common/shared/pipes/menu-item-text.pipe';
import {FileSizePipe} from '@common/shared/pipes/filesize.pipe';
import {ReversePipe} from '@common/shared/pipes/reverse.pipe';
import {TagsMenuComponent} from '@common/shared/ui-components/tags/tags-menu/tags-menu.component';
import {EntityFooterComponent} from '@common/shared/entity-page/entity-footer/entity-footer.component';
import {ClipboardModule} from 'ngx-clipboard';
import {MatMenuModule} from '@angular/material/menu';
import {MatExpansionModule} from '@angular/material/expansion';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {ButtonToggleComponent} from '@common/shared/ui-components/inputs/button-toggle/button-toggle.component';
import {OverlayComponent} from '@common/shared/ui-components/overlay/overlay/overlay.component';
import {TableModule} from 'primeng/table';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {PushPipe} from '@ngrx/component';
import {ExperimentHeaderComponent} from '@common/experiments/dumb/experiment-header/experiment-header.component';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {IdBadgeComponent} from '@common/shared/components/id-badge/id-badge.component';
import {OpenDatasetVersionContentComponent} from '@common/dataset-version/open-dataset-version-content/open-dataset-version-content.component';
import {ExperimentOutputLogComponent} from '@common/experiments/containers/experiment-output-log/experiment-output-log.component';




export const routes: Routes = [
  {
    path: '',
    component: OpenDatasetVersionsComponent,
    children: [
      {
        path: ':versionId', component: OpenDatasetVersionInfoComponent,
      },
    ]
  }
];


@NgModule({
  declarations: [
    OpenDatasetVersionsComponent,
    OpenDatasetVersionMenuComponent,
    OpenDatasetVersionInfoComponent,
    OpenDatasetVersionDetailsComponent,
    DatasetVersionStepComponent,
  ],
  imports: [
    CommonModule,
    AngularSplitModule,
    ExperimentSharedModule,
    ExperimentCompareSharedModule,
    ExperimentOutputLogModule,
    DebugImagesModule,
    RouterModule.forChild(routes),
    HesitateDirective,
    UniqueByPipe,
    TimeAgoPipe,
    ReplaceViaMapPipe,
    MenuItemTextPipe,
    FileSizePipe,
    ReversePipe,
    TagsMenuComponent,
    EntityFooterComponent,
    ClipboardModule,
    MatMenuModule,
    MatExpansionModule,
    TooltipDirective,
    TableComponent,
    ButtonToggleComponent,
    OverlayComponent,
    TableModule,
    ShowTooltipIfEllipsisDirective,
    PushPipe,
    ExperimentHeaderComponent,
    MatIconButton,
    MatIcon,
    MatButton,
    IdBadgeComponent,
    OpenDatasetVersionPreviewComponent,
    OpenDatasetVersionContentComponent,
    ExperimentOutputLogComponent
  ]
})
export class DatasetVersionModule { }
