import {makeEnvironmentProviders} from '@angular/core';
import {provideState} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {reducers} from '@common/workers-and-queues/reducers/index.reducer';
import {WorkersEffects} from '@common/workers-and-queues/effects/workers.effects';
import {QueuesEffect} from '@common/workers-and-queues/effects/queues.effects';

export const workersAndQueuesProviders = makeEnvironmentProviders([
  provideState('workersAndQueues', reducers),
  provideEffects([WorkersEffects, QueuesEffect]),
]);
