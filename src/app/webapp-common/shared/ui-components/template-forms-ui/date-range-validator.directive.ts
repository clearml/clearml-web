import { FormGroup, ValidatorFn, ValidationErrors } from '@angular/forms';

/**
 * Custom validator to check if the 'from' date is before the 'to' date.
 * If 'from' > 'to', it returns an error object on the FormGroup.
 * @param fromControlName The name of the start date form control (e.g., 'from').
 * @param toControlName The name of the end date form control (e.g., 'to').
 * @returns A ValidatorFn that can be applied to a FormGroup.
 */
export const dateRangeValidator: ValidatorFn = (
  control: FormGroup
): ValidationErrors | null => {
  const fromControl = control.get('from');
  const toControl = control.get('to');

  // Check if controls exist and have values
  if (!fromControl || !toControl || !fromControl.value || !toControl.value) {
    return null; // Don't validate if dates are not set yet (or let required validator handle it)
  }

  // Convert to Date objects for comparison
  const startDate = new Date(fromControl.value);
  const endDate = new Date(toControl.value);

  // Validation logic: is the start date after the end date?
  if (startDate > endDate) {
    // Return an error object if the validation fails
    return { datesInverted: true };
  }

  // Return null if the validation passes
  return null;
};
