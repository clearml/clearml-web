import {ChangeDetectionStrategy, Component, input} from '@angular/core';


@Component({
  selector: 'sm-labeled-row',
  templateUrl: './labeled-row.component.html',
  styleUrls: ['./labeled-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: []
})
export class LabeledRowComponent {
  label = input<string>();
  showRow = input<boolean>(true);
  labelClass = input<string>();
}
