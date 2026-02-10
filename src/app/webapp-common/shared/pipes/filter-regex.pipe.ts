import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterRegex',
  })
export class RegexPipe implements PipeTransform{

  transform(value, pattern) {
    if (!value) {
      return
    }

    if (typeof value === 'object') {
      return value.filter(({key}) => (new RegExp(pattern)).test(key));
    }
    return value.filter(param => (new RegExp(pattern)).test(param));
  }
}
