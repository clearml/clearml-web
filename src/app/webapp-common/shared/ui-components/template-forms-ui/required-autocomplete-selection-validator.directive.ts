import {Directive, input} from '@angular/core';
import {AbstractControl, NG_VALIDATORS, ValidationErrors, Validator} from '@angular/forms';


@Directive({
  selector: '[smRequiredAutocompleteSelectionValidator]',
  providers: [{provide: NG_VALIDATORS, useExisting: RequiredAutocompleteSelectionValidatorDirective, multi: true}],
})
export class RequiredAutocompleteSelectionValidatorDirective implements Validator {

  smRequiredAutocompleteSelectionValidatorDisabled = input<boolean>(false);

  validate(control: AbstractControl): ValidationErrors | null {
    if(this.smRequiredAutocompleteSelectionValidatorDisabled()) {
      return null;
    }
    return (typeof control.value === 'string' && control.value !== '') ? {requiredAutocompleteSelection: {value: control.value}} : null;
  }
}


