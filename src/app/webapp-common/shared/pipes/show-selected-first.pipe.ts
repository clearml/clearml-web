import {Pipe, PipeTransform} from '@angular/core';

export function sortByArr(a, b, colsOrder = []) {
  const indexOfA = colsOrder.indexOf(a);
  const indexOfB = colsOrder.indexOf(b);
  return ((indexOfA >= 0) ? indexOfA : 99) - ((indexOfB >= 0) ? indexOfB : 99);
}

@Pipe({
  name: 'showSelectedFirst',
  })
export class ShowSelectedFirstPipe implements PipeTransform {
  transform(arr: Array<any>, selectedArr: Array<any>): Array<any> {
    if (arr.length > 0 && selectedArr.length > 0) {
      return arr.sort((a, b) => sortByArr(a.value, b.value, selectedArr));
    } else {
      return arr;
    }
  }
}


