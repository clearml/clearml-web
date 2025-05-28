import {Component} from '@angular/core';
import {AdminCredentialTableBaseDirective} from '../admin-credential-table.base';
import {TIME_FORMAT_STRING} from '@common/constants';


@Component({
    selector: 'sm-admin-credential-table',
    templateUrl: './admin-credential-table.component.html',
    styleUrls: ['./admin-credential-table.component.scss'],
    standalone: false
})
export class AdminCredentialTableComponent extends AdminCredentialTableBaseDirective {
  timeFormatString = TIME_FORMAT_STRING;
}
