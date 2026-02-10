import {Pipe, PipeTransform} from '@angular/core';
import {escape} from 'lodash-es';

@Pipe({
  name: 'breadcrumbsEllipsis',
  })
export class BreadcrumbsEllipsisPipe implements PipeTransform {

  transform(value: string) {

    const count = (value?.match(/\//g) || []).length;

    if (count > 1) {
      return `<div class="sub-path">${escape(value.substring(0, value.indexOf('/')))}</div>/<i class="al-ico-dots al-icon sm"></i><div class="sub-path">${escape(value.substring(value.lastIndexOf('/')))}</div>`;
    }
    return `<div class="sub-path double-width">${escape(value)}</div>`;
  }

}
