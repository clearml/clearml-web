import {Component, Input} from '@angular/core';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';

@Component({
    selector: 'sm-vertical-labeled-row',
    templateUrl: './vertical-labeled-row.component.html',
    styleUrls: ['./vertical-labeled-row.component.scss'],
    imports: [
        TooltipDirective,
        ShowTooltipIfEllipsisDirective
    ]
})
export class VerticalLabeledRowComponent {
  @Input() label: string;
  @Input() showRow? = true;
  @Input() labelClass: string;
  @Input() tooltip: string;
}
