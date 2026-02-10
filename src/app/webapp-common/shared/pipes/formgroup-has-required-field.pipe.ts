import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'formgroupHasRequiredField',
  })
export class FormgroupHasRequiredFieldPipe implements PipeTransform {

  transform(formGroup: any): string {
    return formGroup.fields.some(field => field.required)? '*': '';
  }

}
