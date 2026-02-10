import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getCounterString',
  })
export class GetCounterStringPipe implements PipeTransform {

  transform(visibility: boolean[], ...args: unknown[]): string {
    return  visibility[0] === null ? `${visibility.length}` : `${visibility.filter(a => a).length} of ${visibility.length}`;
  }

}
