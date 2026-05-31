import {provideState} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {singleGraphReducer} from '@common/shared/single-graph/single-graph.reducer';
import {SingleGraphEffects} from './single-graph.effects';

export const singleGraphProviders = [
  provideState('singleGraph', singleGraphReducer),
  provideEffects([SingleGraphEffects]),
];
