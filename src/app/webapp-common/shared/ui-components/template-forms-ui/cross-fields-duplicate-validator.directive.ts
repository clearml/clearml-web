import {Directive, Input} from '@angular/core';
import {AbstractControl, NG_VALIDATORS, ValidationErrors, Validator} from '@angular/forms';

export const crossFieldsDuplicatesValidator = (control:AbstractControl, fieldNames: string[]): ValidationErrors | null => {
    const controls = fieldNames.map(name=> control.get(name));
    return (new Set(controls.map(control=> control?.value)).size !== controls.length ? { crossFieldsDuplicates: true } : null);
}

@Directive({
  selector: '[smCrossFieldsDuplicatesValidator]',
  providers: [{provide: NG_VALIDATORS, useExisting: ExistNameValidatorDirective, multi: true}],
})
export class ExistNameValidatorDirective implements Validator {
  @Input('smCrossFieldsDuplicatesValidator') fieldsNames: string[] = [];
  validate(control: AbstractControl): ValidationErrors | null {
    return this.fieldsNames ? crossFieldsDuplicatesValidator(control, this.fieldsNames) : null;
  }
}


