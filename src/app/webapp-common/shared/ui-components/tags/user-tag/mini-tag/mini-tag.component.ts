import {ChangeDetectionStrategy, Component, input} from '@angular/core';

@Component({
  selector: 'sm-mini-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mini-tag.component.html',
  styleUrl: './mini-tag.component.scss'
})
export class MiniTagComponent {
  color = input<{
    background: string;
    foreground: string;
  }>();
}
