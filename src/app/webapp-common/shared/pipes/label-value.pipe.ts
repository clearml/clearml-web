import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'labelValue',
  })
export class LabelValuePipe implements PipeTransform {
  constructor() {
  }

  transform(value: string[], args?: any): Array<{ label: string; value: string }> {
    if (!value) {
      return null;
    }
    if (!value.every(item => typeof item === 'string')) {
      return value as any;
    }
    return value.map(item => ({label: item === '*' ? 'Any Label' : item, value: item}));
  }
}
