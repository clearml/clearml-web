import {ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import {CircleTypeEnum} from '~/shared/constants/non-common-consts';
import {TIME_FORMAT_STRING} from '@common/constants';
import {CopyClipboardComponent} from '@common/shared/ui-components/indicators/copy-clipboard/copy-clipboard.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {DatePipe} from '@angular/common';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {CircleStatusComponent} from '@common/shared/ui-components/indicators/circle-status/circle-status.component';
import {CircleCounterComponent} from '@common/shared/ui-components/indicators/circle-counter/circle-counter.component';
import {CardComponent} from '@common/shared/ui-components/panel/card/card.component';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {Model} from '~/business-logic/model/models/model';


@Component({
    selector: 'sm-model-card',
    templateUrl: './model-card.component.html',
    styleUrls: ['./model-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CopyClipboardComponent,
        TooltipDirective,
        DatePipe,
        TimeAgoPipe,
        CircleStatusComponent,
        CircleCounterComponent,
        CardComponent,
        ShowTooltipIfEllipsisDirective
    ]
})
export class ModelCardComponent {
  protected readonly TIME_FORMAT_STRING = TIME_FORMAT_STRING;
  protected readonly CircleTypeEnum = CircleTypeEnum;

  model = input<Model>();
  modelCardClicked = output<Model>();


  public modelClicked() {
    this.modelCardClicked.emit(this.model());
  }
}
