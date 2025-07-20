import {AbstractControl, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';

export function minLengthTrimmed(len: number): ValidatorFn {
  return (control:AbstractControl) : ValidationErrors | null => {
    const val = control.value?.trim();
    const required = control.hasValidator(Validators.required);
    if (!val && !required || val?.length >= len) {
      return null;
    }
    return {minlength: true};
  }
}
