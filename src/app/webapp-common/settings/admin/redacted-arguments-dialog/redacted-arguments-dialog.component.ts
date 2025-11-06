import {ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {MatDialogActions, MatDialogRef} from '@angular/material/dialog';
import {Store} from '@ngrx/store';
import {setRedactedArguments} from '@common/core/actions/layout.actions';
import {selectRedactedArguments} from '@common/core/reducers/view.reducer';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {FormsModule} from '@angular/forms';
import {MatInput} from '@angular/material/input';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatError, MatFormField} from '@angular/material/form-field';
import {UuidPipe} from '@common/shared/pipes/uuid.pipe';


@Component({
  selector: 'sm-redacted-arguments-dialog',
  templateUrl: './redacted-arguments-dialog.component.html',
  styleUrls: ['./redacted-arguments-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogTemplateComponent,
    FormsModule,
    MatFormField,
    MatError,
    MatInput,
    MatIconButton,
    MatIconModule,
    UuidPipe,
    MatButton,
    MatDialogActions
  ]
})
export class RedactedArgumentsDialogComponent {
  public readonly dialogRef = inject<MatDialogRef<RedactedArgumentsDialogComponent>>(MatDialogRef<RedactedArgumentsDialogComponent>);
  private readonly store = inject(Store);

  protected redactedArguments = this.store.selectSignal(selectRedactedArguments);

  applyChanges() {
    this.store.dispatch(setRedactedArguments({
      redactedArguments: this.redactedArguments().filter(value => !!value.key?.trim())
    }));
    this.dialogRef.close();
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
