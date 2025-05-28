import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'jsonIndent',
})
export class JsonIndentPipe implements PipeTransform {
  transform(value: string): string {
    try {
      return JSON.stringify(JSON.parse(value), null, '\t');
    } catch (e) {
      return value;
    }
  }
}
