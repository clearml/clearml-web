import {ChangeDetectionStrategy, Component, effect, input, output} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {RippleButtonComponent} from '@common/shared/ui-components/buttons/ripple-button/ripple-button.component';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {AppendComponentOnTopElementDirective} from '@common/shared/directive/append-component-on-top-element.directive';
import {MatIcon} from '@angular/material/icon';


export interface Option<D> {
  value: D;
  label: string;
  icon?: string;
  ripple?: boolean;
}


@Component({
    selector: 'sm-button-toggle',
    templateUrl: './button-toggle.component.html',
    styleUrls: ['./button-toggle.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatButtonToggleModule,
        TooltipDirective,
        ReactiveFormsModule,
        AppendComponentOnTopElementDirective,
        MatIcon
    ]
})
export class ButtonToggleComponent<D> {

  public rippleComponent = RippleButtonComponent;
  public formControl = new FormControl();

  options = input<Option<D>[]>();
  disabled = input<boolean>();
  rippleEffect = input<boolean>();
  value = input<D>();
  vertical = input(false);
  valueChanged = output<D>();

  constructor() {
    effect(() => {
      this.formControl.patchValue(this.value(), {emitEvent: false});
    });
  }
}
