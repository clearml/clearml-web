import {Pipe, PipeTransform} from '@angular/core';
import {last} from 'lodash-es';

@Pipe({
  name: 'isAudio',
  })
export class IsAudioPipe implements PipeTransform {
  static audioExtensions = ['wav', 'mp3', 'flac', 'mid', 'au', 'ra', 'snd'];

  transform(value: string, args?: any): any {
    if(!value){
      return false;
    }
    const path = value.split('?')[0];
    return IsAudioPipe.audioExtensions.includes(last(path.split('.')).toLowerCase());
  }
}
