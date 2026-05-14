import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';

@Component({
  selector: 'sm-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ClickStopPropagationDirective
  ]
})
export class OverlayComponent {
  backdropActive = input<boolean>();
  transparent = input(false);
}
