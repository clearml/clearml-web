import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'simpleFilter',
  })
export class SimpleFilterPipe implements PipeTransform {
  transform(items: any[], term: string): any {
    if (!term) {
      return items;
    }
    return items?.filter(item => item.toLowerCase().includes(term.toLowerCase())) ?? [];
  }
}

