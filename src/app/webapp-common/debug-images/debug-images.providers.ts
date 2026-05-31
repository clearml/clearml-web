import {provideState} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {debugSamplesReducer} from './debug-images-reducer';
import {DebugImagesEffects} from './debug-images-effects';
import {debugSampleProviders} from '@common/shared/debug-sample/debug-sample.providers';

export const debugImagesProviders = [
  provideState('debugImages', debugSamplesReducer),
  provideEffects([DebugImagesEffects]),
  ...debugSampleProviders
];