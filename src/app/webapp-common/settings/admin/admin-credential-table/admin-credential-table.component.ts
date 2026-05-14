import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {AdminCredentialTableBaseDirective} from '../admin-credential-table.base';
import {TIME_FORMAT_STRING} from '@common/constants';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {DatePipe} from '@angular/common';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {Store} from '@ngrx/store';
import {selectCredentialExpirationEnabled} from '~/core/reducers/auth.reducers';


@Component({
  selector: 'sm-admin-credential-table',
  templateUrl: './admin-credential-table.component.html',
  styleUrls: ['./admin-credential-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TooltipDirective,
    DatePipe,
    TimeAgoPipe,
    MatIconButton,
    MatIconModule
  ]
})
export class AdminCredentialTableComponent extends AdminCredentialTableBaseDirective {
  private store = inject(Store);
  protected expirationEnabled = this.store.selectSignal(selectCredentialExpirationEnabled);

  timeFormatString = TIME_FORMAT_STRING;

  expirationState(expire: string) {
    if (!expire) {
      return { isExpired: false, isNear: false, tooltip: null };
    }

    const now = Date.now();
    const expirationTime = new Date(expire).getTime();
    const millisecondsUntilExpiration = expirationTime - now;
    const daysUntilExpiration = millisecondsUntilExpiration / (24 * 60 * 60 * 1000);

    const isExpired = daysUntilExpiration < 0;
    const isNearExpiration = daysUntilExpiration >= 0 && daysUntilExpiration <= 7;

    return {
      isExpired,
      isNear: isNearExpiration,
      tooltip: isExpired ? 'API key is expired' : (isNearExpiration ? 'API key is about to expire' : null)
    };
  }
}
