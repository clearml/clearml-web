import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import {CdkScrollable} from '@angular/cdk/overlay';

@Component({
  selector: 'sm-wizard-dialog-step',
  templateUrl: './wizard-dialog-step.component.html',
  styleUrls: ['./wizard-dialog-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkScrollable
  ]
})
export class WizardDialogStepComponent {
  icon = input<string>();
  label = input<string>();
  subLabel = input<string>();
  stepNumber = input<number>(0);
  hideStep = input<boolean>(false);
  showFooter = input<boolean>(true);
  enableIconAnimation = input(true);
}
