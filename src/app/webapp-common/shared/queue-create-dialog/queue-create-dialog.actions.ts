import {CreationStatusEnum} from './queue-create-dialog.reducer';
import {QueuesUpdateRequest} from '~/business-logic/model/queues/queuesUpdateRequest';
import {QueuesCreateRequest} from '~/business-logic/model/queues/queuesCreateRequest';
import {createAction, props} from '@ngrx/store';
import {Queue} from '@common/workers-and-queues/actions/queues.actions';

export const getQueues = createAction('[CREATE_QUEUE_DIALOG] GET_QUEUES');
export const setQueues = createAction('[CREATE_QUEUE_DIALOG] SET_QUEUES', props<{ queues: Queue[] }>());
export const resetState = createAction('[CREATE_QUEUE_DIALOG] RESET_STATE');
export const createNewQueue = createAction('[CREATE_QUEUE_DIALOG] CREATE_NEW_QUEUE', props<QueuesCreateRequest>());
export const updateQueue = createAction('[CREATE_QUEUE_DIALOG] UPDATE_QUEUE', props<{ queue: QueuesUpdateRequest }>());
export const setCreationStatus = createAction('[CREATE_QUEUE_DIALOG] SET_CREATION_STATUS', props<{ status: CreationStatusEnum }>());
