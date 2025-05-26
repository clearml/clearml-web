import {ChangeDetectionStrategy, Component, input, signal} from '@angular/core';
import { TooltipPosition } from '@angular/material/tooltip';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ClipboardModule} from 'ngx-clipboard';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

@Component({
    selector: 'sm-copy-clipboard',
    templateUrl: './copy-clipboard.component.html',
    styleUrls: ['./copy-clipboard.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        TooltipDirective,
        ClipboardModule,
        ClickStopPropagationDirective,
        MatIcon,
        MatButton
    ]
})
export class CopyClipboardComponent {

  clipboardText = input<string>();
  disabled = input(false);
  label = input<string>('Copy to clipboard');
  tooltipText = input('Copy to clipboard');
  copyIcon = input<string>();
  tooltipPosition = input<TooltipPosition>('above');
  smallIcon = input(false);

  public copied = signal(false);

  copyToClipboard() {
    this.copied.set(true);
    setTimeout(() => {
      this.copied.set(false);
    }, 5000);
  }
}
