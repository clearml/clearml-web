import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'count',
  })
export class CountPipe implements PipeTransform {

  transform(items: any[], countMetadata): any[] {
    countMetadata.count = items?.length || 0;
    return items;
  }

}
