import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {queueCreateDialogReducer} from './queue-create-dialog.reducer';
import {QueueCreateDialogEffects} from './queue-create-dialog.effects';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {
  UniqueNameValidatorDirective
} from '@common/shared/ui-components/template-forms-ui/unique-name-validator.directive';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {MatInputModule} from '@angular/material/input';
import {PushPipe} from '@ngrx/component';
import {
  CreateNewQueueFormComponent
} from '@common/shared/queue-create-dialog/create-new-queue-form/create-new-queue-form.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    StoreModule.forFeature('queueCreateDialog', queueCreateDialogReducer),
    EffectsModule.forFeature([QueueCreateDialogEffects]),
    UniqueNameValidatorDirective,
    DialogTemplateComponent,
    MatInputModule,
    PushPipe,
    CreateNewQueueFormComponent,
  ],
})
export class QueueCreateDialogModule {
}
