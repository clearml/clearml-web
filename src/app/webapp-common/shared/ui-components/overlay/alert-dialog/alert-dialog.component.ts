import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {isAnnotationTask} from '../../../utils/shared-utils';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {MatButton} from '@angular/material/button';


@Component({
  selector: 'sm-alert-dialog',
  templateUrl: './alert-dialog.component.html',
  styleUrls: ['./alert-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogTemplateComponent,
    MatDialogModule,
    MatButton,
  ]
})
export class AlertDialogComponent {
  protected data = inject<{
    alertMessage: string;
    alertSubMessage: string;
    okMessage: string;
    moreInfo: Record<string, any>;
    resultMessage: string
  }>(MAT_DIALOG_DATA);
  protected moreInfo = signal(this.data.moreInfo);
  protected resultMessage = signal(this.data.resultMessage ?? '');
  protected moreInfoEntities = computed(() => this.moreInfo() && Object.keys(this.moreInfo()));

  public setMoreInfo(moreInfo: Record<string, any>) {
    this.moreInfo.set(moreInfo);
  }

  public setResultMessage(resultMessage: string) {
    this.resultMessage.set(resultMessage);
  }

  gotoUrl(entity, entityName) {
    let url;
    if (entityName === 'datasets') {
      url = `/datasets/${entity.id}`;
    } else if (entityName === 'tasks' && isAnnotationTask(entity)) {
      url = `/annotations?q=${entity.id}`;
    } else {
      url = `/projects/${entity?.project?.id ?? '*'}/experiments/${entity.id}`;
    }
    if (url) {
      const a = document.createElement('a');
      a.target = '_blank';
      a.href = url;
      a.click();
      a.remove();
    }
  }
}
