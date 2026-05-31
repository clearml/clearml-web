import {ChangeDetectionStrategy, Component, effect, inject} from '@angular/core';
import {MatDialogActions, MatDialogRef} from '@angular/material/dialog';
import {Store} from '@ngrx/store';
import {setRedactedArguments} from '@common/core/actions/layout.actions';
import {selectRedactedArguments} from '@common/core/reducers/view.reducer';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {FormArray, FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatInput} from '@angular/material/input';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatError, MatFormField} from '@angular/material/form-field';


@Component({
  selector: 'sm-redacted-arguments-dialog',
  templateUrl: './redacted-arguments-dialog.component.html',
  styleUrls: ['./redacted-arguments-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogTemplateComponent,
    ReactiveFormsModule,
    MatFormField,
    MatError,
    MatInput,
    MatIconButton,
    MatIconModule,
    MatButton,
    MatDialogActions
  ]
})
export class RedactedArgumentsDialogComponent {
  public readonly dialogRef = inject<MatDialogRef<RedactedArgumentsDialogComponent>>(MatDialogRef<RedactedArgumentsDialogComponent>);
  private readonly store = inject(Store);
  private readonly fb = inject(NonNullableFormBuilder);
  private args = this.store.selectSignal(selectRedactedArguments);

  protected argumentsArray = new FormArray([] as FormControl[]);

  constructor() {
    const handle = effect(() => {
      if (this.args()) {
        this.args().forEach(arg => this.argumentsArray.push(this.createArgumentControl(arg.key)));
        handle.destroy();
      }
    });
  }

  addArgument() {
    this.argumentsArray.push(this.createArgumentControl(''));
  }

  removeArgument(index: number) {
    this.argumentsArray.removeAt(index);
  }

  applyChanges() {
    this.store.dispatch(setRedactedArguments({
      redactedArguments: this.argumentsArray.controls
        .map(control => ({key: control.value}))
        .filter(value => !!value.key?.trim())
    }));
    this.dialogRef.close();
  }

  closeDialog() {
    this.dialogRef.close();
  }

  private createArgumentControl(value: string): FormControl<string> {
    return this.fb.control(value, Validators.required);
  }
}
