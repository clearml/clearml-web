import {
  Component,
  computed,
  effect,
  inject,
  input,
  output
} from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatDialogActions} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {
  uniqueNameValidator,
} from '@common/shared/ui-components/template-forms-ui/unique-name-validator.directive';
import {MatInput} from '@angular/material/input';
import {minLengthTrimmed} from '@common/shared/validators/minLengthTrimmed';
import {SelectQueue} from '@common/experiments/shared/components/select-queue/select-queue.actions';

export interface QueueFormData {
  name: string;
  display_name: string;
}

@Component({
  selector: 'sm-create-new-queue-form',
  templateUrl: './create-new-queue-form.component.html',
  styleUrls: ['./create-new-queue-form.component.scss'],
  imports: [
    MatDialogActions,
    MatButton,
    MatFormField,
    FormsModule,
    MatInput,
    MatLabel,
    MatError,
    ReactiveFormsModule,
  ],
})
export class CreateNewQueueFormComponent {
  private fb = inject(FormBuilder);

  protected queueForm = this.fb.group({
    name: [null as string, [Validators.required, minLengthTrimmed(3)]],
    display_name: [null as string, [minLengthTrimmed(3),]]
  });

  queues = input<SelectQueue[]>();
  queue = input<SelectQueue>({name: null, id: null} as SelectQueue);
  queueCreated = output<QueueFormData>();

  protected queuesNames = computed(() => {
    const names = this.queues()?.map(queue => queue.name);
    return this.queue().name ? names.filter(name => name !== this.queue().name) : names;
  });
  protected isEdit = computed(() => !!this.queue().id);

  constructor() {
    effect(() => {
      if (this.queue().name) {
        this.queueForm.patchValue({name: this.queue().name, display_name: this.queue().display_name || null});
      }
    });

    effect(() => {
      if (this.queuesNames()?.length > 0) {
        this.queueForm.controls.name.setValidators([ Validators.required,
          minLengthTrimmed(3),
          uniqueNameValidator(this.queuesNames())
        ]);
        this.queueForm.controls.display_name.setValidators([minLengthTrimmed(3), uniqueNameValidator(this.queuesNames())]);
      }
    });
  }

  send() {
    if (this.queueForm.valid) {
      this.queueCreated.emit(this.queueForm.value as QueueFormData);
    }
  }
}
