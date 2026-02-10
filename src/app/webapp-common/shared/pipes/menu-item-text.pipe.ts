import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'menuItemText',
  })
export class MenuItemTextPipe implements PipeTransform {

  transform(numberOfItems: number, itemName: string, isMultiple = true): string {
    if (!isMultiple) {
      return itemName;
    }
    if (numberOfItems > 0) {
      return `${itemName} (${numberOfItems} item${numberOfItems > 1 ? 's' : ''}) `;
    }
    return itemName;
  }

}
