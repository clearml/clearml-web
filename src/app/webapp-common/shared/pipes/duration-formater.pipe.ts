import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'durationFormater',
  })
export class DurationFormaterPipe implements PipeTransform {

  transform(value: any, inputFormat: 's' | 'ms', timeFormat: string): any {
    if (!value) {
      return '';
    }
    let days: any;
    let seconds: any;
    let minutes: any;
    let hours: any;

    if (inputFormat === 'ms' && timeFormat === 'hhmmss') {
      seconds = Math.floor((value / 1000) % 60);
      minutes = Math.floor(((value / (1000 * 60)) % 60));
      hours = Math.floor((value / (1000 * 60 * 60)));
      return this.format(timeFormat, seconds, minutes, hours, days);

    } else if (inputFormat === 's' && timeFormat === 'hhmmss') {
      seconds = Math.floor((value % 60));
      minutes = Math.floor(((value / 60) % 60));
      hours = Math.floor(((value / 60) / 60));
      return this.format(timeFormat, seconds, minutes, hours, days);

    } else if (inputFormat === 'ms' && (timeFormat === 'ddhhmmss' || timeFormat === 'ddhhmmssLong')) {
      seconds = Math.floor(((value / 1000) % 60));
      minutes = Math.floor((value / (1000 * 60) % 60));
      hours = Math.floor((value / (1000 * 60 * 60) % 24));
      days = Math.floor((value / (1000 * 60 * 60 * 24)));
      return this.format(timeFormat, seconds, minutes, hours, days);

    } else if (inputFormat === 's' && (timeFormat === 'ddhhmmss' || timeFormat === 'ddhhmmssLong')) {
      seconds = Math.floor(value % 60);
      minutes = Math.floor(((value / 60) % 60));
      hours = Math.floor(((value / 60) / 60) % 24);
      days = Math.floor((((value / 60) / 60) / 24));
      return this.format(timeFormat, seconds, minutes, hours, days);

    } else {
      return value;
    }
  }

  private format = (arg2, seconds, minutes, hours, days) => {
    (days < 10) ? days = '0' + days : days;
    (hours < 10) ? hours = '0' + hours : hours;
    (minutes < 10) ? minutes = '0' + minutes : minutes;
    (seconds < 10) ? seconds = '0' + seconds : seconds;

    switch (arg2) {
      case 'hhmmss':
        return `${hours}:${minutes}:${seconds}`;

      case 'ddhhmmss':
        return `${days === '00' ? '' : days}${days === '00' ? '' : 'd'}
        ${(days === '00' && hours === '00') ? '' : hours}${(days === '00' && hours === '00') ? '' : 'h'}
        ${(days === '00' && hours === '00' && minutes === '00') ? '' : minutes}${(days === '00' && hours === '00' && minutes === '00')?'':'m'}
        ${seconds}s`;


      case 'ddhhmmssLong':
        return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
      default:
        return '';
    }

  };

}
