import { Pipe, PipeTransform } from '@angular/core';
import {capitalize} from 'lodash-es';

@Pipe({
  name: 'camelToTitle',
  })
export class CamelToTitlePipe implements PipeTransform {

  transform(value: string): string {

    if (!value || typeof(value) !== 'string') {
      return value;
    }

    const words = value.match(/[A-Za-z][a-z]*/g);

    return words.map(capitalize).join(' ');
  }
}
