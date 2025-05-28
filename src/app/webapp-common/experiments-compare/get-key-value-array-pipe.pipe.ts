import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'getKeyValueArrayPipe',
    standalone: false
})
export class GetKeyValueArrayPipePipe implements PipeTransform {

  transform(metricNode: any, allKeysEmptyObject, keyOrderSortConfig, valueKey = 'value', args?: any): any {
    const keyValueObj = {};

    Object.values(allKeysEmptyObject[metricNode.key]).forEach((variantObj: any) => {
      keyValueObj[variantObj.variant] = '';
    });
    if (metricNode.value || metricNode.value === 0) {
      Object.values(metricNode.value).forEach((variantObj: any) => {
        keyValueObj[variantObj.variant] = variantObj[valueKey];
      });
    }
    let keyValueArray = [];
    if (!keyOrderSortConfig) {
      keyValueArray = Object.keys(keyValueObj).map(key => {
        return {key, 'value': keyValueObj[key]};
      });
      keyValueArray.sort(function (a, b) {
        return a.key.toLowerCase().localeCompare(b.key.toLowerCase());
      });
    } else {
      keyValueArray = keyOrderSortConfig.keyOrder.map(key => {
        return {key, 'value': keyValueObj[key]};
      });
    }
    return keyValueArray;

  }

}
