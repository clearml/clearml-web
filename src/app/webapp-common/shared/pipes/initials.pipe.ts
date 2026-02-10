import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'initials',
  })
export class InitialsPipe implements PipeTransform {

  transform(value: string) {
    if (value !== null) {
      return value.split(' ').map(part => part[0]).join('');
    }
    return value;
  }

}
