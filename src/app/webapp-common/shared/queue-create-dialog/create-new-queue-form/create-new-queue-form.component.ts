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
import {Queue} from '@common/workers-and-queues/actions/queues.actions';
import {minLengthTrimmed} from '@common/shared/validators/minLengthTrimmed';

export interface QueueFormData {
  name: string;
  display_name: string;
}

@Component({
    selector: 'sm-create-new-queue-form',
    templateUrl: './create-new-queue-form.component.html',
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
    styleUrls: ['./create-new-queue-form.component.scss']
})
export class CreateNewQueueFormComponent {
  private fb = inject(FormBuilder);

  protected queueForm = this.fb.group({
    name: [null as string, [Validators.required, minLengthTrimmed(3)]],
    display_name: [null as string, [minLengthTrimmed(3),]]
  });

  queues = input<Queue[]>();
  queue = input<Queue>({name: null, id  : null} as Queue);
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
