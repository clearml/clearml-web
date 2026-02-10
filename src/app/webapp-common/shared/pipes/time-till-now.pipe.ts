import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'timeTillNow',
  })
export class TimeTillNowPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    if (!value) {
      return '';
    }
    const now       = new Date();
    const startDate = new Date(value);
    const ms = now.getTime() - startDate.getTime();
    let seconds = ms / 1000;
    // 2- Extract hours:
    const hours = parseInt((seconds / 3600).toString(), 10); // 3,600 seconds in 1 hour

    seconds = seconds % 3600; // seconds remaining after extracting hours
    // 3- Extract minutes:
    const minutes = ('0' + parseInt((seconds / 60).toString(), 10)).slice(-2); // 60 seconds in 1 minute
    // 4- Keep only seconds not extracted to minutes:
    seconds = seconds % 60;
    return ( hours + ':' + minutes + ' hrs');
  }
}
