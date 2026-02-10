import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'countLines',
  })
export class CountLinesPipe implements PipeTransform {

  transform(text: string) {
    return text.split(/\n|\r|\r\n/).length;
  }
}
