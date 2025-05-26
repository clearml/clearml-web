import {ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, OnInit, Signal, signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Queue} from '@common/workers-and-queues/actions/queues.actions';
import {Store} from '@ngrx/store';
import {getQueuesForEnqueue, getTaskForEnqueue, setTaskForEnqueue} from './select-queue.actions';
import {selectQueuesList, selectTaskForEnqueue} from './select-queue.reducer';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {BlTasksService} from '~/business-logic/services/tasks.service';
import {startWith} from 'rxjs/operators';
import {userAllowedToCreateQueue$} from '~/core/reducers/users.reducer';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {splitLine} from '@common/shared/utils/shared-utils';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {RequiredAutocompleteSelectionValidatorDirective} from '@common/shared/ui-components/template-forms-ui/required-autocomplete-selection-validator.directive';
import {MatInput} from '@angular/material/input';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from '@angular/material/autocomplete';
import {StringIncludedInArrayPipe} from '@common/shared/pipes/string-included-in-array.pipe';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {MatButton} from '@angular/material/button';
import {SlicePipe} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';

@Component({
    selector: 'sm-select-queue',
    templateUrl: './select-queue.component.html',
    styleUrls: ['./select-queue.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        DialogTemplateComponent,
        TooltipDirective,
        MatFormField,
        RequiredAutocompleteSelectionValidatorDirective,
        MatInput,
        ReactiveFormsModule,
        MatAutocompleteTrigger,
        MatAutocomplete,
        StringIncludedInArrayPipe,
        MatOption,
        ShowTooltipIfEllipsisDirective,
        MatButton,
        SlicePipe,
        MatError,
        MatLabel
    ]
})
export class SelectQueueComponent implements OnInit, OnDestroy {
      public dialogRef = inject<MatDialogRef<ConfirmDialogComponent>>(MatDialogRef<ConfirmDialogComponent>);
      private store = inject(Store);
      private blTaskService = inject(BlTasksService);
      protected data = inject<{
        taskIds?: string[];
        reference?: string;
        retryMode?: boolean;
      }>(MAT_DIALOG_DATA);

  public queues = this.store.selectSignal(selectQueuesList);
  public tasksForEnqueue = this.store.selectSignal(selectTaskForEnqueue);
  public enqueueWarning = computed(() =>
    this.tasksForEnqueue()?.some(task => !(task && task.script && (task.script.diff || (task.script.repository && task.script.entry_point)))))
  public reference = signal('');
  public queueControl = new FormControl<string | Queue>('');
  split = splitLine;
  displayFn = (item: any): string => typeof item === 'string' ? item : item?.caption ?? item?.name;
  public filteredOptions: Signal<Queue[]>;
  protected userAllowedToCreateQueue: Signal<boolean>;
  private valueChange = toSignal(this.queueControl.valueChanges.pipe(startWith('')));

  protected queuesNames = computed(() => this.queues().map(q => q.name));
  protected queuesDisplays = computed(() => this.queues().map(q => q.display_name).filter(name => !!name));
  protected defaultQueue = computed(() => this.blTaskService.getDefaultQueue(this.queues()) || this.queues()[0]);


  constructor() {
    this.store.dispatch(getQueuesForEnqueue());
    this.userAllowedToCreateQueue = toSignal(userAllowedToCreateQueue$(this.store));

    if (this.data?.taskIds?.length > 0) {
      this.store.dispatch(getTaskForEnqueue({taskIds: this.data.taskIds}));
      this.reference.set(this.data.taskIds.length < 2 ?  this.data.reference : `${this.data.taskIds.length} tasks `);
    }

    effect(() => {
      if (this.queues()) {
        this.queueControl.reset(this.defaultQueue(), {emitEvent: false});
      }
    });
  }

  ngOnInit() {
    this.filteredOptions = computed(() => {
      if (!this.queues()) {
        return [];
      }
      const name = (typeof this.valueChange() === 'string' ? this.valueChange() as string: (this.valueChange() as Queue)?.name)?.toLowerCase();
      if (this.queueControl.pristine || !name) {
        return this.queues();
      }
      return this.queues().filter(q => q.name.toLowerCase().includes(name) || q.display_name?.toLowerCase().includes(name));
    })
  }

  closeDialog(confirmed) {
    this.dialogRef.close({confirmed, queue: this.queueControl.value});
  }

  ngOnDestroy(): void {
    this.store.dispatch(setTaskForEnqueue({tasks: null}));
  }

}
