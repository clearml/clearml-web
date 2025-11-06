import {ChangeDetectionStrategy, Component} from '@angular/core';
import {AdminCredentialTableBaseDirective} from '../admin-credential-table.base';
import {TIME_FORMAT_STRING} from '@common/constants';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {DatePipe} from '@angular/common';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';


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
  timeFormatString = TIME_FORMAT_STRING;
}
