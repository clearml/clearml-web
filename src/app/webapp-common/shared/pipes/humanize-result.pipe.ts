import { Pipe, PipeTransform } from '@angular/core';
import {humanizeUsage} from '@common/shared/utils/time-util';

@Pipe({
  name: 'humanizeResult',
  standalone: true // Remove if using an NgModule-based project
})
export class HumanizeResultPipe implements PipeTransform {

  // Assuming humanizeUsage is available in your scope or imported
  transform(slice: any, units: any): string {
    if (isNaN(slice)) return '';

    const result = humanizeUsage(units, slice);

    // Returns the formatted string: "10 GB"
    if (!result.humanizedUnit) {
      return `${result.humanizedValue}`;
    }
    return `${result.humanizedValue} ${result.humanizedUnit}`;
  }
}
