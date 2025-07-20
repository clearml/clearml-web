import {Directive, Input} from '@angular/core';
import {AbstractControl, AsyncValidator, NG_ASYNC_VALIDATORS, ValidationErrors} from '@angular/forms';
import {Observable} from 'rxjs';
import {debounceTime, first, map} from 'rxjs/operators';

@Directive({
  selector : '[smUniqueInListValidator][ngModel]',
  providers: [{provide: NG_ASYNC_VALIDATORS, useExisting: UniqueInListValidatorDirective, multi: true}],
})

export class UniqueInListValidatorDirective implements AsyncValidator {
  @Input() listSelector$: Observable<any>;

  registerOnValidatorChange(fn: () => void): void {
  }

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    return this.listSelector$.pipe(debounceTime(10),
      map(labelEnumerations => {
        return labelEnumerations.filter(labelEnum => (labelEnum.outputLabel === control.value)).length > 1 ? {'uniqueInList': true} : null;
      }
    ), first());
  }
}
