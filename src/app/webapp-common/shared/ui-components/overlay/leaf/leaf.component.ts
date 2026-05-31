import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';

@Component({
  selector: 'sm-leaf',
  templateUrl: './leaf.component.html',
  styleUrls: ['./leaf.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeafComponent {
  codeOpen = input(false);
  codeEnabled = input(false);
  chooseClicked = output();
}
