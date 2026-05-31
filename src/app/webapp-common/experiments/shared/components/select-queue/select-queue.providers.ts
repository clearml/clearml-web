import {provideState} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {selectQueueFeature} from './select-queue.reducer';
import {SelectQueueEffects} from './select-queue.effects';

export const selectQueueProviders = [
  provideState(selectQueueFeature),
  provideEffects([SelectQueueEffects]),
];
