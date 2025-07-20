import {Directive, Input} from '@angular/core';
import {AbstractControl, NG_VALIDATORS, ValidationErrors, Validator, ValidatorFn} from '@angular/forms';

export const existNameValidator = (names): ValidatorFn =>
  (control: AbstractControl): Record<string, any> | null => {
    const value = control.value?.label || control.value?.name || control.value;

    const forbidden = !names.includes(value);
    return forbidden ? {existName: {value: control.value}} : null;
  };

@Directive({
  selector: '[smExistNameValidator]',
  providers: [{provide: NG_VALIDATORS, useExisting: ExistNameValidatorDirective, multi: true}]
})
export class ExistNameValidatorDirective implements Validator {
  @Input('smExistNameValidator') existNames: any = [];
  validate(control: AbstractControl): ValidationErrors | null {
    return this.existNames ? existNameValidator(this.existNames)(control) : null;
  }
}


