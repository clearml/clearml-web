import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'floor',
  })
export class FloorPipe implements PipeTransform {

  transform(value: number, decimalDigits= 0): number {
    const magicNum = Math.pow(10, decimalDigits);

    return Math.floor(value * magicNum) / magicNum;
  }

}
