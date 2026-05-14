import {provideState} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {projectDialogReducer} from './project-dialog.reducer';
import {ProjectDialogEffects} from './project-dialog.effects';

export const projectDialogProviders = [
  provideState('projectCreateDialog', projectDialogReducer),
  provideEffects([ProjectDialogEffects]),
];
