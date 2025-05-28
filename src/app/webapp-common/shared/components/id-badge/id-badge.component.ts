import {Component, input, output, viewChild } from '@angular/core';
import {MatMenuTrigger} from '@angular/material/menu';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ClipboardModule} from 'ngx-clipboard';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';

@Component({
    selector: 'sm-id-badge',
    templateUrl: './id-badge.component.html',
    styleUrls: ['./id-badge.component.scss'],
    imports: [
        TooltipDirective,
        ClipboardModule,
        ClickStopPropagationDirective
    ]
})
export class IdBadgeComponent {
  trigger = viewChild.required(MatMenuTrigger);
  id = input<string>();
  short = input(false);
  caption = input('Copy full ID')
  copied = output();

  openMenu() {
    this.trigger().openMenu();
  }
}
