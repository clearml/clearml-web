import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';
import semverValid from 'semver/functions/valid';

export const coerceSemver = (value: string): string => {
  if (value && /^\d+\.\d+$/.test(value.trim())) {
    return `${value.trim()}.0`;
  }
  return value;
};

export const semverValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) {
    return null;
  }
  return semverValid(coerceSemver(control.value)) ? null : {invalidSemver: true};
};
