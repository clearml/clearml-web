import {provideState} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {queueCreateDialogReducer} from './queue-create-dialog.reducer';
import {QueueCreateDialogEffects} from './queue-create-dialog.effects';

export const queueCreateDialogProviders = [
  provideState('queueCreateDialog', queueCreateDialogReducer),
  provideEffects([QueueCreateDialogEffects]),
];
