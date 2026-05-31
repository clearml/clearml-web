import {provideState} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {debugSampleReducer} from '@common/shared/debug-sample/debug-sample.reducer';
import {DebugSampleEffects} from '@common/shared/debug-sample/debug-sample.effects';

export const debugSampleProviders = [
  provideState('debugSample', debugSampleReducer),
  provideEffects([DebugSampleEffects])
];
