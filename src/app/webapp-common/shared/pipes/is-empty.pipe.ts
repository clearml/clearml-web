import { Pipe, PipeTransform } from '@angular/core';
import {isEmpty} from 'lodash-es';

@Pipe({
  name: 'isEmpty',
  })
export class IsEmptyPipe implements PipeTransform {

  transform(value: unknown): unknown {
    return isEmpty(value);
  }

}
