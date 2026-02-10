import {Pipe, PipeTransform} from '@angular/core';
import {v4} from 'uuid';

@Pipe({
  name: 'uuid',
  })
export class UuidPipe implements PipeTransform {

  transform(value: string): string {
    return `${value}-${v4()}`;
  }

}
