import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {FormsModule, NgForm} from '@angular/forms';
import {MatDialogActions} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {
  UniqueNameValidatorDirective
} from '@common/shared/ui-components/template-forms-ui/unique-name-validator.directive';
import {MatInput} from '@angular/material/input';
import {Queue} from '@common/workers-and-queues/actions/queues.actions';


@Component({
    selector: 'sm-create-new-queue-form',
    templateUrl: './create-new-queue-form.component.html',
    imports: [
        MatDialogActions,
        MatButton,
        MatFormField,
        FormsModule,
        UniqueNameValidatorDirective,
        MatInput,
        MatLabel,
        MatError,
    ],
    styleUrls: ['./create-new-queue-form.component.scss']
})
export class CreateNewQueueFormComponent {
  public queuesNames: string[];

  @Input() set queues(queues) {
    this.queuesNames = queues.map(queue => queue.name);
    if (this.queue.name) {
      this.queuesNames = this.queuesNames.filter(name => name !== this.queue.name);
    }
  }

  @Input() queue = {
    name: null,
    id  : null
  } as Queue;

  @Output() queueCreated = new EventEmitter();
  @ViewChild('queueForm', {static: true}) queueForm: NgForm;


  get isEdit(): boolean {
    return !!this.queue.id;
  }

  send() {
    if (this.queueForm.valid) {
      this.queueCreated.emit(this.queue);
    } else {
      this.queueForm.onSubmit(null);
    }
  }
}
