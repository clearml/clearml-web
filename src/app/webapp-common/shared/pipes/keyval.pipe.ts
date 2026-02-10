import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
  name: 'keyval',
  })
export class KeyvalPipe implements PipeTransform {

  transform(arr: Array<object>, key, value): any {

    if(!Array.isArray(arr)) {
      if(!arr) {
        return ''
      }
      throw 'Keyval pipe accept arrays only.';
    }
    if(!key) {
      throw 'Keyval pipe key is required.';
    }
    if(!value) {
      throw 'Keyval pipe value is required.';
    }

    const map = arr.reduce((map, obj) => {
      if(!obj[key]) {
        throw `Keyval pipe: key: ${key} is not object: .` + JSON.stringify(obj);
      }
      if(!obj[value]) {
        throw `Keyval pipe: value: ${value} is not exists on object: .` + JSON.stringify(obj);
      }
      map[obj[key]] = obj[value];
      return map;
    }, {});

    let str = '';
    let first = true;
    Object.entries(map).forEach(([key, value]) => {
      str += first ? `${key}=${value}` : ',' + `${key}=${value}`;
      first = false;
    });

    return str;
  }

}
