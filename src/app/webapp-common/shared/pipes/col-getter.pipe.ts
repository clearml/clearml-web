import {Pipe, PipeTransform} from '@angular/core';
import {get} from 'lodash-es';
import {ISmCol} from '../ui-components/data/table/table.consts';

@Pipe({
  name: 'colGetter',
  })
export class ColGetterPipe implements PipeTransform {

  transform(entity: any, col: ISmCol): string {
    const result = get(entity, col.getter, '');
    return typeof get(entity, col.getter, '') === 'object' ? JSON.stringify(result) : result;
  }

}
