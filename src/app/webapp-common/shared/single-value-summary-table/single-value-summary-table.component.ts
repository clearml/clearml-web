import {ChangeDetectionStrategy, Component, TemplateRef, input, Output, EventEmitter} from '@angular/core';
import {
  EventsGetTaskSingleValueMetricsResponseValues
} from '~/business-logic/model/events/eventsGetTaskSingleValueMetricsResponseValues';
import {download} from '../utils/download';

import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import {SortPipe} from '@common/shared/pipes/sort.pipe';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {NgTemplateOutlet} from '@angular/common';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';

@Component({
    selector: 'sm-single-value-summary-table',
    templateUrl: './single-value-summary-table.component.html',
    styleUrls: ['./single-value-summary-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SortPipe,
    MatIcon,
    MatIconButton,
    NgTemplateOutlet,
    TooltipDirective,
    ShowTooltipIfEllipsisDirective
  ]
})
export class SingleValueSummaryTableComponent {
  data = input<EventsGetTaskSingleValueMetricsResponseValues[]>();
  experimentName = input<string>();
  csvButtonTemplate = input<TemplateRef<SVGAElement>>();
  @Output() createEmbedCode = new EventEmitter<{xaxis: ScalarKeyEnum; domRect: DOMRect}>();
  public hover: boolean;

  public downloadTableAsCSV() {
    const vals = this.data().map(item=>item.value) as number[];
    const headers = this.data().map(item=>item.variant);
    if (vals && headers) {
      let data = headers.join(',') + '\n' + vals.join(',');
      const exportName = `${this.experimentName()} summary.csv`;
      data = 'data:text/csv;charset=utf-8,' + encodeURIComponent(data);
      download(data, exportName);
    }
  }

  createEmbedCodeClicked($event: MouseEvent) {
    this.createEmbedCode.emit({xaxis: null, domRect: {x: $event.clientX, y: $event.clientY} as unknown as DOMRect});
  }
}
