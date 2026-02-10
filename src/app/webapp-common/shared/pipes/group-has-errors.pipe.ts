import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'groupHasErrors',
  })
export class GroupHasErrorsPipe implements PipeTransform {
  transform(formValueChanged, invalid): string {
    return invalid? 'Group configuration is invalid': '';
  }
}
