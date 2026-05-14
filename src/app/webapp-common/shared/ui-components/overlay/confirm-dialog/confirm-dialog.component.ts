import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ConfirmDialogConfig} from './confirm-dialog.model';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {FormsModule} from '@angular/forms';
import {SaferPipe} from '@common/shared/pipes/safe.pipe';
import {NgTemplateOutlet} from '@angular/common';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'sm-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  // host: {
  //   '[style.width.px]': 'this.data.width || 640'
  // },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogTemplateComponent,
    MatCheckboxModule,
    FormsModule,
    NgTemplateOutlet,
    SaferPipe,
    MatButton
  ]
})
export class ConfirmDialogComponent {
  protected data = inject<ConfirmDialogConfig>(MAT_DIALOG_DATA);
  protected dialogRef = inject<MatDialogRef<ConfirmDialogComponent>>(MatDialogRef<ConfirmDialogComponent>);

  protected neverShowAgain: boolean;
  protected title = this.data.title || '';
  protected reference = this.data.reference || '';
  protected body = this.data.body || '';
  protected template = this.data.template;
  protected templateContext = this.data.templateContext;
  protected yes = this.data.yes || '';
  protected no = typeof this.data.no === 'string' && this.data?.no ? this.data.no : '';
  protected iconClass = this.data.iconClass || '';
  protected iconData = this.data.iconData || '';
  protected showNeverShowAgain = this.data.showNeverShowAgain || false;
  protected centerText = this.data.centerText ?? false;

  displayX = input(true);

  closeDialog(isConfirmed: boolean) {
    if (isConfirmed) {
      this.dialogRef.close({isConfirmed, neverShowAgain: this.neverShowAgain});
    } else {
      this.dialogRef.close(isConfirmed);
    }
  }
}
