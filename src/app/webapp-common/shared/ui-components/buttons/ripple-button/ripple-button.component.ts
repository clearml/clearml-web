import {ChangeDetectionStrategy, Component, Input} from '@angular/core';

@Component({
  selector: 'sm-ripple-button',
  templateUrl: './ripple-button.component.html',
  styleUrls: ['./ripple-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RippleButtonComponent {
  @Input() top = 0;
  @Input() left = 0;

  public height = 48;
  public width = 48;
}
