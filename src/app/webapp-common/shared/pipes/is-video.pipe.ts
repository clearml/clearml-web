import {Pipe, PipeTransform} from '@angular/core';
import {last} from 'lodash-es';

@Pipe({
  name: 'isVideo',
  })
export class IsVideoPipe implements PipeTransform {
  static videoExtensions = ['ogv', 'mp4', 'webm', 'ogg', 'm4v', 'avi', 'mov', 'wmv'];

  transform(value: string, args?: any): any {
    if(!value){
      return false;
    }
    const path = value.split('?')[0];
    return IsVideoPipe.videoExtensions.includes(last(path.split('.')).toLowerCase());
  }
}
