import {calculateQueuesCaption} from '@common/workers-and-queues/workers-and-queues.utils';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {inject, Injectable} from '@angular/core';
import {createNewQueue, updateQueue, getQueues, setQueues, setCreationStatus} from './queue-create-dialog.actions';
import {CREATION_STATUS} from './queue-create-dialog.reducer';
import {catchError, map, mergeMap, switchMap} from 'rxjs/operators';
import {activeLoader, addMessage, deactivateLoader} from '../../core/actions/layout.actions';
import {requestFailed} from '../../core/actions/http.actions';
import {ApiQueuesService} from '~/business-logic/api-services/queues.service';
import {MESSAGES_SEVERITY} from '@common/constants';
import {selectQueueFields} from '~/features/experiments/shared/experiments.const';


@Injectable()
export class QueueCreateDialogEffects {
  private actions = inject(Actions);
  private queuesApiService = inject(ApiQueuesService);

  activeLoader = createEffect(() => this.actions.pipe(
    ofType(createNewQueue),
    map(action => activeLoader(action.type))
  ));

  createQueue = createEffect(() => this.actions.pipe(
    ofType(createNewQueue),
    mergeMap((action) => this.queuesApiService.queuesCreate({name: action.name, display_name: action.display_name})
      .pipe(
        mergeMap(() => [
          deactivateLoader(action.type),
          setCreationStatus({status: CREATION_STATUS.SUCCESS}),
          addMessage(MESSAGES_SEVERITY.SUCCESS, 'Queue Created Successfully'),
        ]),
        catchError(error => [deactivateLoader(action.type),
          requestFailed(error),
          addMessage(MESSAGES_SEVERITY.ERROR, 'Queue Created Failed'),
          setCreationStatus({status: CREATION_STATUS.FAILED})
        ])
      )
    )
  ));

  updateQueue = createEffect(() => this.actions.pipe(
    ofType(updateQueue),
    mergeMap((action) => this.queuesApiService.queuesUpdate(action.queue)
      .pipe(
        mergeMap(() => [
          deactivateLoader(action.type),
          setCreationStatus({status: CREATION_STATUS.SUCCESS}),
          addMessage(MESSAGES_SEVERITY.SUCCESS, 'Queue Updated Successfully'),
        ]),
        catchError(error => [
          deactivateLoader(action.type),
          requestFailed(error),
          addMessage(MESSAGES_SEVERITY.ERROR, 'Queue Update Failed'),
          setCreationStatus({status: CREATION_STATUS.FAILED})
        ])
      )
    )
  ));

  getAllQueues = createEffect(() => this.actions.pipe(
    ofType(getQueues),
    switchMap(() => this.queuesApiService.queuesGetAllEx({
        only_fields: selectQueueFields,
      })
        .pipe(
          map(res => setQueues({queues: calculateQueuesCaption(res.queues)})),
          catchError(error => [requestFailed(error)])
        )
    )
  ));
}
