import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'projectLocation',
  })
export class ProjectLocationPipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): string {
    if (!value) {
      return '';
    }
    const lastSeparator = value.lastIndexOf('/');
    return lastSeparator > 0 ? value.substring(0, lastSeparator) : 'Projects root';
  }

}
