import {Pipe, PipeTransform} from '@angular/core';
import {getLowestFraction} from '../utils/shared-utils';

@Pipe({
  name: 'vulgarFraction',
})
export class VulgarFractionPipe implements PipeTransform {
  private static readonly EPS = 1e-8;
  private static readonly unicodeMap: Record<string, string> = {
    '1/2': '½',
    '1/3': '⅓', '2/3': '⅔',
    '1/4': '¼', '3/4': '¾',
    '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘',
    '1/6': '⅙', '5/6': '⅚',
    '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞',
    '1/9': '⅑',
    '1/10': '⅒',
  } as const;

  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '';
    }

    const negative = value < 0;
    const abs = Math.abs(value);

    // Split into integer and fractional parts
    let integer = Math.floor(abs);
    let fraction = abs - integer;

    // Handle rounding edge-cases (e.g., 1.0000000)
    if (1 - fraction < VulgarFractionPipe.EPS) {
      integer += 1;
      fraction = 0;
    }

    if (fraction < VulgarFractionPipe.EPS) {
      return (negative ? '-' : '') + integer.toString();
    }

    const [num, den] = getLowestFraction(fraction);

    if (num === den) {
      // Fraction rounded to a whole
      return (negative ? '-' : '') + (integer + 1).toString();
    }

    const key = `${num}/${den}` as const;
    const unicode = VulgarFractionPipe.unicodeMap[key];

    const sign = negative ? '-' : '';
    if (integer === 0) {
      return sign + (unicode ? `<span class="vulgar-fraction">${unicode}</span>` : `${num}/${den}`);
    }

    return `${sign}${integer} ${unicode ? `<span class="vulgar-fraction">${unicode}</span>` : `${num}/${den}`}`;
  }
}
