import {Pipe, PipeTransform} from '@angular/core';
import {isReadOnly} from '@common/shared/utils/is-read-only';

@Pipe({
  name: 'hasExampleItem',
  })
export class HasExampleItemPipe implements PipeTransform {

  transform(value: Array<any>, args?: any): any {
    return value.find(item => isReadOnly(item));
  }

}
