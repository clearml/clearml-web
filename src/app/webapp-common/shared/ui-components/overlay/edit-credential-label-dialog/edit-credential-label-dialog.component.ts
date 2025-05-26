import {AfterViewInit, ChangeDetectionStrategy, Component, Inject, Input, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {MatInputModule} from '@angular/material/input';
import {FormsModule} from '@angular/forms';

@Component({
    selector: 'sm-edit-credential-label-dialog',
    templateUrl: './edit-credential-label-dialog.component.html',
    styleUrls: ['./edit-credential-label-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ConfirmDialogComponent,
        MatInputModule,
        FormsModule
    ]
})
export class EditCredentialLabelDialogComponent implements AfterViewInit {

  @Input() displayX: boolean = true;
  public label: string;

  @ViewChild(ConfirmDialogComponent) confirmDialog: ConfirmDialogComponent;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { label: string },
    public dialogRef: MatDialogRef<EditCredentialLabelDialogComponent>,
  ) {
    this.label = data.label;
  }

  ngAfterViewInit(): void {
    if (this.confirmDialog) {
      this.confirmDialog.closeDialog = this.closeDialog.bind(this);
    }
  }

  closeDialog(confirm: boolean) {
    this.dialogRef.close(confirm ? this.label : null);
  }
}
