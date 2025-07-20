import {Directive, Input} from '@angular/core';
import {AbstractControl, NG_VALIDATORS, ValidationErrors, Validator, ValidatorFn} from '@angular/forms';

export const uniqPathValidator = (names: string[], currentName: string): ValidatorFn => (control: AbstractControl): Record<string, any> | null => {
  const forbidden = names.includes(control.value + '/' + currentName);
  return forbidden ? {uniquePath: {value: control.value}} : null;
};

@Directive({
  selector: '[smUniquePathValidator]',
  providers: [{provide: NG_VALIDATORS, useExisting: UniquePathValidatorDirective, multi: true}],
})
export class UniquePathValidatorDirective implements Validator {
  @Input() existingPaths: string[];
  @Input() currentName: string;

  validate(control: AbstractControl): ValidationErrors | null {
    return this.existingPaths ? uniqPathValidator(this.existingPaths, this.currentName)(control) : null;
  }
}


