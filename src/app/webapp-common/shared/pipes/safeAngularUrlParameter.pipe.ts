import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'safeUrlParameter',
  })
export class safeAngularUrlParameterPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!value) {
      return;
    }
    return encodeURIComponent(value);
  }

}
