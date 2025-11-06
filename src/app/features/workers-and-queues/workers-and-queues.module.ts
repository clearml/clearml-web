import {NgModule} from '@angular/core';
import {WorkersAndQueuesRoutingModule} from './workers-and-queues-routing.module';
import {reducers} from '@common/workers-and-queues/reducers/index.reducer';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {WorkersEffects} from '@common/workers-and-queues/effects/workers.effects';
import {QueuesEffect} from '@common/workers-and-queues/effects/queues.effects';

@NgModule({
  imports: [
    WorkersAndQueuesRoutingModule,
    StoreModule.forFeature('workersAndQueues', reducers),
    EffectsModule.forFeature([WorkersEffects, QueuesEffect]),
  ],
})
export class WorkersAndQueuesModule {
}
