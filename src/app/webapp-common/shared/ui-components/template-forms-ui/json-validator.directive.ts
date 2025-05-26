import {AbstractControl, ValidationErrors} from '@angular/forms';

export function json(control: AbstractControl): ValidationErrors | null {
  try {
    JSON.parse(control.value);
    return null;
  } catch (e) {
    return {'jsonValidator': {value: control.value}};
  }
}
