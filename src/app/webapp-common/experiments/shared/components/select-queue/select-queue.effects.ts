import {inject, Injectable} from '@angular/core';
import {calculateQueuesCaption} from '@common/workers-and-queues/workers-and-queues.utils';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {map, switchMap} from 'rxjs/operators';
import {getQueuesForEnqueue, setQueuesForEnqueue, getTaskForEnqueue, setTaskForEnqueue} from './select-queue.actions';
import {ApiQueuesService} from '~/business-logic/api-services/queues.service';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {selectQueueFields} from '~/features/experiments/shared/experiments.const';

@Injectable()
export class SelectQueueEffects {
  private actions$ = inject(Actions);
  private apiQueues = inject(ApiQueuesService);
  private tasksApi = inject(ApiTasksService);

  getQueuesForEnqueue$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(getQueuesForEnqueue),
      switchMap(() => this.apiQueues.queuesGetAllEx({
        only_fields: selectQueueFields,
        }).pipe(
          map((res) => setQueuesForEnqueue({queues: calculateQueuesCaption(res.queues)}))
        )
      ))
  });

  getTaskForEnqueue$ = createEffect(() => this.actions$.pipe(
    ofType(getTaskForEnqueue),
    switchMap(action => this.tasksApi.tasksGetAllEx({
      id: action.taskIds,
      only_fields: ['status', 'script.repository', 'script.entry_point', 'script.diff']
    })),
    map(res => setTaskForEnqueue({tasks: res.tasks}))
  ));
}
