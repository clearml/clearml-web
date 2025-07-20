import {Pipe, PipeTransform} from '@angular/core';
import {sortByField} from '../../tasks/tasks.utils';

@Pipe({
  name: 'sort',
  standalone: true
})
export class SortPipe implements PipeTransform {

  transform(arr: any[], field: string): any[] {
    return field ? sortByField(arr, field) : [...arr].sort();
  }
}

@Pipe({
  name: 'sortHumanize',
})
export class SortHumanizePipe implements PipeTransform {
  private collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});

  transform(array: any[], field?: string): any[] {
    const arr = [...array];
    if(field) {
      arr.sort((a, b) => this.collator.compare(a[field], b[field]));
    } else {
      arr.sort((a, b) => this.collator.compare(a, b));
    }
    return arr;
  }
}
