import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'hideHash',
  })
export class HideHashPipe implements PipeTransform {

  transform(value: string, args?: any): any {
    if (value.startsWith('hash_') || value.startsWith('a_hash_') || value === '') {
      return '';
    } else {
      return value + ' : ';
    }
  }
}
