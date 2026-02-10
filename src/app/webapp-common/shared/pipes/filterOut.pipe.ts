import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'filterOut',
  })
export class FilterOutPipe<T> implements PipeTransform {

  transform(arr: T[], field: string, value: string | boolean): T[] {
    if (!arr || !field || value === undefined) {
      return arr;
    }
    return arr.filter(item => item[field] !== value);
  }
}
