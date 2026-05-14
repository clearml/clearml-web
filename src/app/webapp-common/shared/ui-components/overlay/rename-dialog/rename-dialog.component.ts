import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogRef} from '@angular/material/dialog';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatButton} from '@angular/material/button';
import {MatInput} from '@angular/material/input';
import {minLengthTrimmed} from '@common/shared/validators/minLengthTrimmed';
import {TitleCasePipe} from '@angular/common';

export interface RenameDialogConfig {
  name: string;
  minLength: number;
  iconClass: string;
  header: string;
  pattern: string;
  patternError: string;
  fieldName?: string;
}

@Component({
  selector: 'sm-rename-dialog',
  templateUrl: './rename-dialog.component.html',
  styleUrls: ['./rename-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogTemplateComponent,
    MatDialogActions,
    ReactiveFormsModule,
    MatFormField,
    MatError,
    MatLabel,
    MatButton,
    MatInput,
    TitleCasePipe
  ]
})
export class RenameDialogComponent {
  protected dialogRef = inject(MatDialogRef<RenameDialogComponent>);
  protected data = inject<RenameDialogConfig>(MAT_DIALOG_DATA);
  protected minLength: number = this.data.minLength ?? 3;
  protected pattern: string = this.data.pattern;
  protected patternError: string = this.data.patternError;
  protected iconClass: string = this.data.iconClass;
  protected header: string = this.data.header ?? 'RENAME';
  protected fieldName: string = this.data.fieldName ?? 'name';

  protected nameControl = new FormControl(this.data.name, [
    Validators.required,
    minLengthTrimmed(this.minLength),
    ...(this.pattern ? [Validators.pattern(this.pattern)] : [])
  ]);

  closeDialog(save: boolean) {
    if (save) {
      this.dialogRef.close({name: this.nameControl.value});
    } else {
      this.dialogRef.close();
    }
  }
}
