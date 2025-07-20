import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'sm-leaf',
  templateUrl: './leaf.component.html',
  styleUrls: ['./leaf.component.scss'],
})
export class LeafComponent {
  @Input() codeOpen = false;
  @Input() codeEnabled = false;
  @Output() chooseClicked = new EventEmitter();
}
