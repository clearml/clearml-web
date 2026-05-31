import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'idToObjectsArray',
  })
export class IdToObjectsArrayPipe implements PipeTransform {

  transform(arr: string[]): any[] {
    if (!arr) {
      return [];
    }
    return arr.map(parameter => ({id: parameter}));
  }

}
