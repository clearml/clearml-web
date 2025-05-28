import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CardComponent} from '@common/shared/ui-components/panel/card/card.component';

@Component({
    selector: 'sm-plus-card',
    templateUrl: './plus-card.component.html',
    styleUrls: ['./plus-card.component.scss'],
    imports: [
        CardComponent
    ]
})
export class PlusCardComponent {
  @Input() folder: boolean = false;
  @Output() plusCardClick = new EventEmitter();

  public plusCardClicked() {
    this.plusCardClick.emit();
  }

}
