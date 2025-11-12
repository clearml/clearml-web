import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {MatMenuModule, MenuPositionY, MenuPositionX} from '@angular/material/menu';
import {MatIcon} from '@angular/material/icon';
import {HesitateDirective} from '@common/shared/ui-components/directives/hesitate.directive';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {NgOptimizedImage} from '@angular/common';
import {MatIconButton} from '@angular/material/button';

@Component({
    selector: 'sm-multi-line-tooltip',
    templateUrl: `./multi-line-tooltip.component.html`,
    styleUrls: ['./multi-line-tooltip.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatMenuModule,
    MatIcon,
    HesitateDirective,
    ClickStopPropagationDirective,
    NgOptimizedImage,
    MatIconButton
  ]
})
export class MultiLineTooltipComponent {
  iconClass = input<string>();
  iconImage = input<string>();
  customClass = input<string>();
  smallIcon = input<boolean>(false);
  yPosition = input<MenuPositionY>('below');
  xPosition = input<MenuPositionX>('after');
  wordBreak = input<boolean>(false);
}
