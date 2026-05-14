import {provideState} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {commonDeleteDialogReducer} from './common-delete-dialog.reducer';
import {DeleteDialogEffects} from '~/features/delete-entity/delete-dialog.effects';

export const commonDeleteDialogProviders = [
  provideState('deleteEntityDialog', commonDeleteDialogReducer),
  provideEffects([DeleteDialogEffects])
];
