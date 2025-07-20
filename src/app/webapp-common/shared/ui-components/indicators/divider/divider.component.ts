import {Component, ElementRef, Input, Renderer2} from '@angular/core';

@Component({
  selector: 'sm-divider',
  template: `
    <span class="">{{label}}</span>
  `,
  styleUrls: ['./divider.component.scss'],
})
export class DividerComponent {

  @Input() label: string;

  @Input() set width(width: number) {
    this.setCssVar('width', width);
  }

  @Input() set margin(margin: number) {
    this.setCssVar('margin', margin);
  }

  constructor(private element: ElementRef,
              private renderer: Renderer2) {
  }

  setCssVar(name: string, valueInPx: number) {
    this.renderer.setProperty(this.element.nativeElement, 'style', `--${name}: ${valueInPx}px`);
  }
}

