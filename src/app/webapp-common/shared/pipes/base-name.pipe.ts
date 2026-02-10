import {Pipe, PipeTransform} from '@angular/core';
import {getBaseName} from '@common/shared/utils/shared-utils';

@Pipe({
  name: 'baseName',
  })
export class BaseNamePipe implements PipeTransform {

  transform(value: string): string {
    if (!value) {
      return '';
    }
    return getBaseName(value);
  }
}
