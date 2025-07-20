import {ChangeDetectionStrategy, Component, input} from '@angular/core';

@Component({
  selector   : 'sm-number-counter',
  templateUrl: './number-counter.component.html',
  styleUrls  : ['./number-counter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberCounterComponent {
  counter = input();
  label = input();
}
