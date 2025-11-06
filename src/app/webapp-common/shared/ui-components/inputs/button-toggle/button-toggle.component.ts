import {ChangeDetectionStrategy, Component, input, forwardRef} from '@angular/core';
import {FormControl, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
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
    ],
    providers: [
      {
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => ButtonToggleComponent),
        multi: true
      }
    ]
})
export class ButtonToggleComponent<D> implements ControlValueAccessor {

  public rippleComponent = RippleButtonComponent;
  public formControl = new FormControl();

  options = input<Option<D>[]>();
  disabled = input<boolean>();
  rippleEffect = input<boolean>();
  vertical = input(false);

  private onChange: (value: D) => void;
  private onTouched: () => void;

  constructor() {
    this.formControl.valueChanges.subscribe(value => {
      this.onChange?.(value);
      this.onTouched?.();
    });
  }

  writeValue(obj: D): void {
    this.formControl.patchValue(obj, {emitEvent: false});
  }

  registerOnChange(fn: (value: D) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.formControl.disable({emitEvent: false});
    } else {
      this.formControl.enable({emitEvent: false});
    }
  }
}
