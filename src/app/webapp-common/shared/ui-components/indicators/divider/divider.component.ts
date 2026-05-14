import {ChangeDetectionStrategy, Component, input} from '@angular/core';

@Component({
  selector: 'sm-divider',
  template: `
    <span class="">{{ label() }}</span>
  `,
  styleUrls: ['./divider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  host: {
    '[style.--width.px]': 'width()',
    '[style.--margin.px]': 'margin()'
  }
})
export class DividerComponent {
  label = input<string>();
  width = input<number>();
  margin = input<number>();
}

