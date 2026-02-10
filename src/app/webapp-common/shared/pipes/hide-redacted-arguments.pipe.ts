import {Pipe, PipeTransform} from '@angular/core';

const SECRET = '****************';

@Pipe({
  name: 'hideRedactedArguments',
  })
export class HideRedactedArgumentsPipe implements PipeTransform {

  transform(value: string, redactedArguments: { key: string }[]): string {
    if (!value || typeof (value) !== 'string' || !redactedArguments || redactedArguments?.length < 1) {
      return value;
    }
    const reg = new RegExp(redactedArguments.map(arg => `(${arg.key}\\s*=)`).join('|'));
    return value.trim()
      .split(/\s+(?!=)/)
      .map(section => {
        if (reg.test(section)) {
          return `${section.split(/\s*=/)[0]}=${SECRET}`;
        }
        return section;
      })
      .join(' ');
  }
}
