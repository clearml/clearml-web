import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'shortProjectName',
  })
export class ShortProjectNamePipe implements PipeTransform {

  transform(value: string): string {
    if (!value) {
      return '';
    }
    const shortName = value.substring(value.lastIndexOf('/') + 1);
    return `${((value.startsWith('[') && !shortName.startsWith('['))? '[' : '') + shortName }`;
  }
}
