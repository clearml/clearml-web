import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'toExponential',
  })
export class ToExponentialPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (value === 0) {
      return 0;
    }
    if (!value) {
      return;
    }
    return Number.parseFloat(value).toExponential(3);
  }

}
