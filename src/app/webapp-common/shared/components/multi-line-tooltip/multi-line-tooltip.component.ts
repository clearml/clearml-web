import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {MatMenuModule, MenuPositionY} from '@angular/material/menu';
import {MatIcon} from '@angular/material/icon';
import {HesitateDirective} from '@common/shared/ui-components/directives/hesitate.directive';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';

@Component({
    selector: 'sm-multi-line-tooltip',
    templateUrl: `./multi-line-tooltip.component.html`,
    styleUrls: ['./multi-line-tooltip.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatMenuModule,
    MatIcon,
    HesitateDirective,
    ClickStopPropagationDirective
  ]
})
export class MultiLineTooltipComponent {
  iconClass = input<string>();
  smallIcon = input<boolean>(false);
  position = input<MenuPositionY>('below');
  wordBreak = input<boolean>(false);
}
