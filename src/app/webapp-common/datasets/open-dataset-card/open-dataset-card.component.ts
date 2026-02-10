import {ChangeDetectionStrategy, Component} from '@angular/core';
import {PipelineCardComponent} from '@common/pipelines/pipeline-card/pipeline-card.component';
import {fileSizeConfigStorage, FileSizePipe} from '@common/shared/pipes/filesize.pipe';
import {PipelineCardMenuComponent} from '@common/pipelines/pipeline-card-menu/pipeline-card-menu.component';
import {CircleCounterComponent} from '@common/shared/ui-components/indicators/circle-counter/circle-counter.component';
import {TagListComponent} from '@common/shared/ui-components/tags/tag-list/tag-list.component';
import {CardComponent} from '@common/shared/ui-components/panel/card/card.component';
import {InlineEditComponent} from '@common/shared/ui-components/inputs/inline-edit/inline-edit.component';
import {NAPipe} from '@common/shared/pipes/na.pipe';
import {ShortProjectNamePipe} from '@common/shared/pipes/short-project-name.pipe';
import {CleanProjectPathPipe} from '@common/shared/pipes/clean-project-path.pipe';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {DatePipe} from '@angular/common';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';

@Component({
  selector: 'sm-open-dataset-card',
  templateUrl: './open-dataset-card.component.html',
  styleUrls: ['./open-dataset-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [
    PipelineCardMenuComponent,
    CircleCounterComponent,
    TagListComponent,
    CardComponent,
    InlineEditComponent,
    FileSizePipe,
    NAPipe,
    ShortProjectNamePipe,
    CleanProjectPathPipe,
    TimeAgoPipe,
    DatePipe,
    ClickStopPropagationDirective,
    TooltipDirective,
    ShowTooltipIfEllipsisDirective
  ]
})
export class OpenDatasetCardComponent extends PipelineCardComponent{
  protected readonly fileSizeConfigStorage = {...fileSizeConfigStorage, spacer: '', round: 1};
}
