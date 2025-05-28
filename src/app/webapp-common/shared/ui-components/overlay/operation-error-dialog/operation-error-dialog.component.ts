import {Component, inject } from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogClose} from '@angular/material/dialog';
import {openMoreInfoPopup} from '@common/core/actions/projects.actions';
import {htmlTextShort} from '../../../utils/shared-utils';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {MatButton} from '@angular/material/button';


@Component({
    selector: 'sm-operation-error-dialog',
    templateUrl: './operation-error-dialog.component.html',
    styleUrls: ['./operation-error-dialog.component.scss'],
    imports: [
        DialogTemplateComponent,
        MatDialogActions,
        MatButton,
        MatDialogClose
    ]
})
export class OperationErrorDialogComponent {
  public data = inject<{
    title: string;
    action: ReturnType<typeof openMoreInfoPopup>;
    iconClass: string;
  }>(MAT_DIALOG_DATA);

  public title: string;
  public iconClass = '';
  public action: ReturnType<typeof openMoreInfoPopup>;
  public failed: number;
  public failedList: any[];

  constructor() {
    this.title = this.data.title || '';
    this.action = this.data.action;
    this.failedList = this.data.action.res.failed || [];
    this.failed = this.data.action.res.failed.length || 0;
    this.iconClass = this.data.iconClass || '';
  }

  getName(fail: any) {
    return htmlTextShort(this.action.parentAction.selectedEntities.find(entity => entity.id === fail.id)?.name);
  }
}
