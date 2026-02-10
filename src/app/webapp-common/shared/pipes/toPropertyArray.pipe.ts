import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'toPropertyArray',
  })
export class ToPropertyArrayPipe implements PipeTransform {

  transform(arr: any[], property: string): string[] {
    if (!arr || !property) {
      return arr;
    }
    return arr.map(parameter=> parameter[property]);
  }

}
