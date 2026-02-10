import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'keyValue',
  })
export class KeyValuePipe implements PipeTransform {

  transform(value: object, args?: any): Array<{key: any, value: any}> {
    if(!value) {
      return [];
    }
    return Object.entries(value).map(([key, val]) => ({key, value: val}));
  }

}
