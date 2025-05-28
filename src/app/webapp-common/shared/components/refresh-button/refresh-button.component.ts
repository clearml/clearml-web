import {animate, state, style, transition, trigger} from '@angular/animations';
import {Component, input, output, inject, signal} from '@angular/core';
import {RefreshService} from '@common/core/services/refresh.service';
import {Store} from '@ngrx/store';
import {selectAutoRefresh} from '@common/core/reducers/view.reducer';
import {FormsModule} from '@angular/forms';
import {HesitateDirective} from '@common/shared/ui-components/directives/hesitate.directive';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatButton, MatIconButton} from '@angular/material/button';

@Component({
  selector: 'sm-refresh-button',
  templateUrl: './refresh-button.component.html',
  styleUrls: ['./refresh-button.component.scss'],
  imports: [
    FormsModule,
    HesitateDirective,
    MatSlideToggle,
    MatIconButton,
    MatButton,
  ],
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0 })), // state when element is not present
      state('*', style({ opacity: 1 })),    // state when element is present
      transition('void => *', animate('0.3s ease-in')),
      transition('* => void', animate('0.3s ease-out'))
    ])
  ]
})
export class RefreshButtonComponent {
  protected refreshService = inject(RefreshService);
  private store = inject(Store);

  allowAutoRefresh = input<boolean>(true);
  disabled = input<boolean>(true);
  setAutoRefresh = output<boolean>();

  protected autoRefreshState = this.store.selectSignal(selectAutoRefresh);
  protected showMenu = signal(false);
  protected rotate = signal(false);

  refresh() {
    this.refreshService.trigger();
    this.rotate.set(true);
    window.setTimeout(() => {this.rotate.set(false)}, 1000);
  }
}

