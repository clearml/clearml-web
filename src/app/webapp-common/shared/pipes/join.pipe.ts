import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'join',
  })
export class JoinPipe implements PipeTransform {

  defaultSeparator = ', ';
  transform(value: any[], separator?: string, key?: string): string {
    if (!Array.isArray(value)) {
      return value;
    }

    if (key) {
      return value.map(item => item?.[key]).filter(v => v !== undefined && v !== null).join(separator || this.defaultSeparator);
    }

    return value.join(separator || this.defaultSeparator);
  }

}
