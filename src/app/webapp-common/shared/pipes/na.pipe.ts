import { Pipe, PipeTransform } from '@angular/core';
import {NA} from '~/app.constants';

@Pipe({
  name: 'NA',
})
export class NAPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    return value ? value : NA;
  }
}
