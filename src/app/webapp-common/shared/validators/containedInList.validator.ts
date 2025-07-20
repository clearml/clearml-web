import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

export const containedInList = (list: string[]): ValidatorFn =>
  (control: AbstractControl): ValidationErrors | null =>
    list.includes(control.value) ? null : {notFoundInList: control.value};
