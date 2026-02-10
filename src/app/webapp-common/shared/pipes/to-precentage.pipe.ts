import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'toPercentage',
  })
export class ToPercentagePipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
    if (value !== -1) {
      return Math.floor(value * 100);
    } else {
      return null;
    }
  }
}
