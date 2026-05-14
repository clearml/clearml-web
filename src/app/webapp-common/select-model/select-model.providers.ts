import {provideState} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {selectModelReducer} from './select-model.reducer';
import {SelectModelEffects} from './select-model.effects';

export const selectModelProviders = [
  provideState('selectModel', selectModelReducer),
  provideEffects([SelectModelEffects])
];