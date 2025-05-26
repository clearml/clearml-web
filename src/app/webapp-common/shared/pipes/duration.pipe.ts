import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'duration',
  standalone: true
})
export class DurationPipe implements PipeTransform {

  transform(value: any): any {

    if (!value && value !== 0) {
      return '';
    }
    if (value === 0) {
      return '>1 s';
    } else {
      const result = [];
      let units = 's';
      let calcSeconds = value;
      // 2- Extract hours:
      const days = Math.floor(calcSeconds / 86400);
      if (days) {
        units = 'd';
        result.push(days.toString().padStart(days.toString().length, '0'));
      }
      calcSeconds = calcSeconds % 86400;
      const hours = Math.floor(calcSeconds / 3600) % 100;
      if (days && !hours) {
        return `${result}${units}`;
      } else if (hours) {
        if(units === 'd') {
          result.length > 0 ? result.push(hours.toString().padStart(2, '0')) : result.push(hours.toString());
        } else {
          result.push(hours.toString());
        }
        if (result.length === 2) {
          return `${result.join(':')}${units}`;
        }
        units = 'h';
      }
      calcSeconds = calcSeconds % 3600; // seconds remaining after extracting hours
      // 3- Extract minutes:
      const minutes = Math.floor(calcSeconds / 60) % 100;
      if (hours && !minutes) {
        return `${result}${units}`;
      } else if (minutes) {
        // result.push(minutes.toString().padStart(2, '0'));
        result.length > 0 ? result.push(minutes.toString().padStart(2, '0')) : result.push(minutes.toString());
        if (result.length === 2) {
          return `${result.join(':')}${units}`;
        }
        units = 'm';
      }
      // 4- Keep only seconds not extracted to minutes:
      calcSeconds = calcSeconds % 60; // seconds remaining after extracting hours
      // 3- Extract minutes:
      const seconds = Math.floor(calcSeconds) % 100;
      if (seconds) {
        // result.push(seconds.toString().padStart(2, '0'));
        result.length > 0 ? result.push(seconds.toString().padStart(2, '0')) : result.push(seconds.toString());
        if (result.length === 2) {
          return `${result.join(':')}${units}`;
        }
        units = 's';
      }
      return `${result.join(':')}${units}`;
    }
  }

}
