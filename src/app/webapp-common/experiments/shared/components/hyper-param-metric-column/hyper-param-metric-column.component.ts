import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {GetParamMetricValuePipe} from '@common/experiments/shared/components/hyper-param-metric-column/get-param-metric-value.pipe';
import {GetVariantWithoutRoundPipe} from '@common/experiments/shared/components/hyper-param-metric-column/get-variant-without-round.pipe';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';


@Component({
    selector: 'sm-hyper-param-metric-column',
    templateUrl: './hyper-param-metric-column.component.html',
    styleUrls: ['./hyper-param-metric-column.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        GetParamMetricValuePipe,
        GetVariantWithoutRoundPipe,
        TooltipDirective
    ]
})
export class HyperParamMetricColumnComponent {

  @Input() roundedMetricValue: Record<string, boolean> = {};
  @Input() col: any;
  @Input() experiment: any;
  @Output() expandClicked = new EventEmitter<{ columnId: string; width: number }>();

  expandColToggle(event, col: ISmCol) {
    event.stopPropagation();
    this.roundedMetricValue.noRound = !this.roundedMetricValue.noRound;
    const cellCurrentWidth = event.target.parentElement.parentElement.clientWidth || 0;
    this.expandClicked.emit({columnId: col.id, width: this.roundedMetricValue.noRound ? Math.max(cellCurrentWidth + 1, 200) : 110});
  }

}
