import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogRef} from '@angular/material/dialog';
import {IShareDialogConfig} from './share-dialog.model';
import {addMessage} from '@common/core/actions/layout.actions';
import {Store} from '@ngrx/store';
import {shareSelectedExperiments} from '@common/experiments/actions/common-experiments-menu.actions';
import {MESSAGES_SEVERITY} from '@common/constants';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {ClipboardModule} from 'ngx-clipboard';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {SaferPipe} from '@common/shared/pipes/safe.pipe';
import {MatIcon} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';


@Component({
  selector: 'sm-share-dialog',
  templateUrl: './share-dialog.component.html',
  styleUrls: ['./share-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogTemplateComponent,
    ClipboardModule,
    ClickStopPropagationDirective,
    SaferPipe,
    MatIcon,
    MatButton,
    MatDialogActions
  ]
})
export class ShareDialogComponent {
  protected data = inject<IShareDialogConfig>(MAT_DIALOG_DATA);
  protected dialogRef = inject(MatDialogRef<ShareDialogComponent>);
  private store = inject(Store);

  protected title = this.data.title || '';
  protected sharedSubtitle =`<b>Any registered user with this link</b> has read-only access to this task and all its contents (Artifacts, Results, etc.)`;
  protected privateSubtitle =  `Create a shareable link to grant read access to<b> any registered user</b> you provide this link to.`;
  protected task = this.data.task;

  protected link = this.data.link || '';
  protected shared = signal(!!this.data.alreadyShared);

  closeDialog(isConfirmed) {
    this.dialogRef.close({isConfirmed, shared: this.shared()});
  }

  copyToClipboardSuccess() {
    this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'URL copied successfully'));
  }

  createLink() {
    this.store.dispatch(shareSelectedExperiments({share: !this.shared(), task: this.task}));
    this.shared.update(shared => !shared);
  }
}
