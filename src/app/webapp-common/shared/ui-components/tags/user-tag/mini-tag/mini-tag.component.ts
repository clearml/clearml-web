import {Component, input} from '@angular/core';

@Component({
    selector: 'sm-mini-tag',
    imports: [],
    templateUrl: './mini-tag.component.html',
    styleUrl: './mini-tag.component.scss'
})
export class MiniTagComponent {
  color = input<{
    background: string;
    foreground: string;
  }>();
}
