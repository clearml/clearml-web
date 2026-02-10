import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'testConditional',
  })
export class TestConditionalPipe implements PipeTransform {

  transform(form: any, groupedApplicationForm: [string, any[]][], conditional: {
    op: string;
    entries: {
      name: string;
      value: string;
    }[];
  }, groupIndex: number = 0): boolean {
    const conditions = [];
    const flatForm2Levels = groupedApplicationForm.reduce((acc, group) => {
      group[1].forEach(groupInst => {
        acc.push(groupInst.fields);
      });
      return acc;
    }, []);
    const flatForm1Level = flatForm2Levels.flat(1);
    conditional?.entries?.forEach(ent => {
        const fieldVal = flatForm1Level.filter((field) => field.name === ent.name)[groupIndex].val;
        const r = new RegExp(ent.value);
        conditions.push(r.test(fieldVal));
      }
    );
    if (conditional?.op === 'or') {
      return conditions.some(con => con);
    } else {
      return conditions.filter((con) => !con).length === 0;
    }
  }

}
