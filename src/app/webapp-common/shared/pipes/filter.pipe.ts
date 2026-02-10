import {Pipe, PipeTransform} from '@angular/core';
import {get} from 'lodash-es';

@Pipe({
  name: 'filter',
  })
export class FilterPipe implements PipeTransform {
  transform(arr, query: string | string[], key?: string, maxItems?: number) {
    let res;
    if (!arr || !query) {
      res = arr;
    } else {
      if (Array.isArray(query)) {
        res = arr.filter(item => !(query as string[]).includes((key ? get(item, key) : item)));
      } else if (typeof query === 'string') {
        res = arr.filter(item => (key ? get(item, key) : item)?.toLowerCase().includes(query?.toLowerCase()));
      }
    }
    if (maxItems) {
      return res?.slice(0, maxItems);
    }
    return res;
  }
}
