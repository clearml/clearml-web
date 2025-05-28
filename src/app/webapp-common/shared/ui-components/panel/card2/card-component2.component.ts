import {ChangeDetectionStrategy, Component, Input} from '@angular/core';

@Component({
    selector: 'sm-card2',
    templateUrl: './card-component2.component.html',
    styleUrls: ['./card-component2.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class CardComponent2 {

  @Input() header: string;
  @Input() text: string;
  @Input() showBorder      = false;
  @Input() headerClassName = '';
}
