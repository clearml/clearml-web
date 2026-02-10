import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'allHidden',
  })
export class AllHiddenPipe implements PipeTransform {

  transform(arr: any[]): boolean {
    if (!arr || arr?.length === 0) {
      return false;
    }
    return arr.every(
      annotation=> annotation.hidden
    );
  }

}
