import {Pipe, PipeTransform} from '@angular/core';
import {get} from 'lodash-es';

@Pipe({
  name: 'templateInjector',
  })
export class TemplateInjectorPipe implements PipeTransform {

  transform(formChanged, formGroup: any, index: number): string {
    if (!formGroup.collapsibleTitleTemplate) {
      return `${formGroup.title || formGroup.name || 'Item '} #${index + 1}`;
    }
    const nameValueMap = {};
    formGroup.fields.forEach(field => nameValueMap[field.name] = field.val);
    const match = new RegExp(/\$\{[ ]*([.a-zA-Z_-]*)[ ]*\}/ig);
    const variables = Array.from(formGroup.collapsibleTitleTemplate.matchAll(match));
    let label = formGroup.collapsibleTitleTemplate;
    variables.forEach(variableArr => {
      const getter = variableArr[1];
      const val = get(nameValueMap, getter, '');
      label = label.replace('${index}', (index + 1).toString());
      label = label.replace(variableArr[0], val === null ? '' : val);
      label = label ? label : `${formGroup.title || formGroup.name || 'Item '} #${index + 1}`;
    });
    return label;
  }

}
