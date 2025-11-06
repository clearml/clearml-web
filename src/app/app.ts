import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
  selector: 'sm-root',
  template: `
    <router-outlet></router-outlet>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class AppRootComponent {}
