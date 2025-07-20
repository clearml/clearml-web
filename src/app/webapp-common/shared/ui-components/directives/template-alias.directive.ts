import {ContentChild, Directive, Input, TemplateRef} from '@angular/core';

@Directive({
  selector: '[templateAlias]',
})
export class TemplateAliasDirective {
  @Input('templateAlias') alias: string;
  @ContentChild(TemplateRef) public columnTemplate: TemplateRef<any>;
  constructor(public readonly template: TemplateRef<any>) { }
}
