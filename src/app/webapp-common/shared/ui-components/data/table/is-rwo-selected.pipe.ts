import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'isRowSelected',
  })
export class IsRowSelectedPipe implements PipeTransform {

  transform(entities: {id: string}[], entity): boolean {
    if (!entity || entities === undefined) {
      return false;
    }

    return entities.length > 0 &&
      (entities.some(selectedEntity => selectedEntity.id === entity.id));
  }

}
