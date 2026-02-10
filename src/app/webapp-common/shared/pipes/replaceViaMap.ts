import {Pipe, PipeTransform} from '@angular/core';
import {get} from 'lodash-es';

@Pipe({
  name: 'replaceViaMapPipe',
  })
export class ReplaceViaMapPipe implements PipeTransform {

  transform(value: string, replaceMap: { [key: string]: string }): string {
    if (!value || !replaceMap) {
      return value;
    }
    return get(replaceMap, value, value );
  }

}
