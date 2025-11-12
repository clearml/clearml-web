import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {WorkerExt} from '@common/workers-and-queues/actions/workers.actions';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  VerticalLabeledRowComponent
} from '@common/shared/ui-components/data/veritical-labeled-row/vertical-labeled-row.component';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {CopyClipboardComponent} from '@common/shared/ui-components/indicators/copy-clipboard/copy-clipboard.component';
import {SimpleTableComponent} from '@common/shared/ui-components/data/simple-table/simple-table.component';
import {RouterLink} from '@angular/router';
import {MatTab, MatTabGroup} from '@angular/material/tabs';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {DurationFormaterPipe} from '@common/shared/pipes/duration-formater.pipe';

@Component({
  selector: 'sm-worker-info',
  templateUrl: './worker-info.component.html',
  styleUrls: ['./worker-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TooltipDirective,
    VerticalLabeledRowComponent,
    ShowTooltipIfEllipsisDirective,
    CopyClipboardComponent,
    MatIconModule,
    SimpleTableComponent,
    RouterLink,
    MatTab,
    MatIconButton,
    MatTabGroup,
    TimeAgoPipe,
    DurationFormaterPipe,
  ]
})
export class WorkerInfoComponent {
  selectedWorker = input<WorkerExt>();
  deselectWorker = output();

  public readonly cols     = [
    {header: 'QUEUE', class: ''},
    {header: 'NEXT TASK', class: ''},
    {header: 'IN QUEUE', class: ''},
  ];
}
