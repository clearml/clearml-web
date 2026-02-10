import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'stringIncludedInArray',
  })
export class StringIncludedInArrayPipe implements PipeTransform {

  transform(value: string, stingsArr: string[] = []): boolean {
    if (!value) {
      return false;
    }
    return stingsArr?.includes(value);
  }

}
