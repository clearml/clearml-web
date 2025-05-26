import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

export function minLengthNoSpaces(len: number): ValidatorFn {
  return (control:AbstractControl) : ValidationErrors | null => control.value?.trim().length < len ? {minlength:true}: null
}
