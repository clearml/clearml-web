import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'join',
  })
export class JoinPipe implements PipeTransform {

  defaultSeparator = ', ';
  transform(value: Array<string>, separator?: any): any {
    if(!Array.isArray(value)) {
      throw 'Join pipe accept arrays only.';
    }

    return value.join(separator || this.defaultSeparator);
  }

}
