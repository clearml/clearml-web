import {Component, Inject} from '@angular/core';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatRadioButton, MatRadioChange, MatRadioGroup} from '@angular/material/radio';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButton} from '@angular/material/button';

@Component({
    selector: 'sm-clear-installed-packages-dialog',
    imports: [
        DialogTemplateComponent,
        MatRadioButton,
        MatRadioGroup,
        ReactiveFormsModule,
        FormsModule,
        MatButton
    ],
    templateUrl: './clear-installed-packages-dialog.component.html',
    styleUrl: './clear-installed-packages-dialog.component.scss'
})
export class ClearInstalledPackagesDialogComponent {
  install: 'install' | 'dontInstall' | 'reset' = 'install';
  showReset: boolean;

  constructor(
    public dialogRef: MatDialogRef<ClearInstalledPackagesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: { showReset: boolean }) {
    this.showReset = data?.showReset;
  }

  closeDialog(isConfirmed) {
    if (isConfirmed) {
      this.dialogRef.close({isConfirmed, selectedOption: this.install});
    } else {
      this.dialogRef.close(isConfirmed);
    }
  }

  setInstalledOption($event: MatRadioChange) {
    this.install = $event.value;
  }
}
