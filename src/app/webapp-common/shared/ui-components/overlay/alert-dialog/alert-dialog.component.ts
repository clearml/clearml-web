import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {isAnnotationTask} from '../../../utils/shared-utils';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {MatButton} from '@angular/material/button';


@Component({
    selector: 'sm-alert-dialog',
    templateUrl: './alert-dialog.component.html',
    styleUrls: ['./alert-dialog.component.scss'],
    imports: [
        DialogTemplateComponent,
        MatDialogModule,
        MatButton,
    ]
})
export class AlertDialogComponent {

  public alertMessage;
  public alertSubMessage;
  public okMessage;
  public moreInfoEntities: string[];
  public isOpen = false;
  private _moreInfo: any;
  private _resultMessage: string;

  set moreInfo(moreInfo) {
    this._moreInfo        = moreInfo;
    this.moreInfoEntities = moreInfo && Object.keys(moreInfo);
  }

  get moreInfo() {
    return this._moreInfo;
  }

  set resultMessage(resultMessage) {
    this._resultMessage = resultMessage;
  }

  get resultMessage() {
    return this._resultMessage;
  }

  constructor(@Inject(MAT_DIALOG_DATA) data: { alertMessage: string; alertSubMessage: string; okMessage: string; moreInfo: any; resultMessage: string }) {
    this.alertMessage    = data.alertMessage || '';
    this.alertSubMessage = data.alertSubMessage;
    this.moreInfo        = data.moreInfo;
    this.okMessage       = data.okMessage || 'OK';
    this.resultMessage   = data.resultMessage;
  }

  buildUrl(entity, entityName) {
    if (entityName === 'datasets') {
      return `/datasets/${entity.id}`;
    }
    if (entityName === 'tasks' && isAnnotationTask(entity)) {
      return `/annotations?q=${entity.id}`;
    }
    return `/projects/${entity?.project?.id ?? '*'}/experiments/${entity.id}`;
  }
}
