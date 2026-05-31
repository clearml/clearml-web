import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {CardComponent} from '@common/shared/ui-components/panel/card/card.component';

@Component({
  selector: 'sm-plus-card',
  templateUrl: './plus-card.component.html',
  styleUrls: ['./plus-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardComponent
  ]
})
export class PlusCardComponent {
  folder = input(false);
  plusCardClick = output();

  public plusCardClicked() {
    this.plusCardClick.emit();
  }
}
