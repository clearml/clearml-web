import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'itemById',
  })
export class ItemByIdPipe implements PipeTransform {

  transform(arr: any[], id: string): any {
    if (arr && arr.length > 0 && id) {
      const item = arr.filter(item => item.id === id)[0];
      return item;
    } else {
      return {};
    }
  }
}
