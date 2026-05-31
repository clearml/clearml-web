import {ChangeDetectionStrategy, Component, input} from '@angular/core';

@Component({
  selector   : 'sm-tag',
  templateUrl: './tag.component.html',
  styleUrls  : ['./tag.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: []
})
export class TagComponent {
  label = input<string>();
  className = input<string>();
}
