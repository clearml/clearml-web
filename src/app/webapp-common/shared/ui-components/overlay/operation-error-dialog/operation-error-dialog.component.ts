import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogClose} from '@angular/material/dialog';
import {openMoreInfoPopup} from '@common/core/actions/projects.actions';
import {htmlTextShort} from '../../../utils/shared-utils';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {MatButton} from '@angular/material/button';


@Component({
  selector: 'sm-operation-error-dialog',
  templateUrl: './operation-error-dialog.component.html',
  styleUrls: ['./operation-error-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  protected title = this.data.title || '';
  protected action = this.data.action;
  protected failedList = this.data.action.res.failed || [];
  protected failed = this.data.action.res.failed.length || 0;
  protected iconClass = this.data.iconClass || '';

  getName(fail: any) {
    return htmlTextShort(this.action.parentAction.selectedEntities.find(entity => entity.id === fail.id)?.name);
  }
}
