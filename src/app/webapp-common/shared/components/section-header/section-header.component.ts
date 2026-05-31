import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';


@Component({
  selector: 'sm-section-header',
  templateUrl: './section-header.component.html',
  styleUrls: ['./section-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TooltipDirective
  ]
})
export class SectionHeaderComponent {

  label = input<string>();
  helpText = input<string>();
  showBlob = input<boolean>();
  error = input<string | null>();
  learnMoreClicked = output();
}
