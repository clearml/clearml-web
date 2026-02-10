import {Queue} from '@common/workers-and-queues/actions/queues.actions';
import {createAction, props} from '@ngrx/store';
import {Task} from '~/business-logic/model/tasks/task';

export type SelectQueue = Pick<Queue, 'id' | 'name' | 'display_name' | 'caption' | 'profile_connection'>;

export const SELECT_QUEUE_PREFIX = 'SELECT_QUEUE_';


export const getQueuesForEnqueue = createAction(SELECT_QUEUE_PREFIX + 'GET_QUEUES_FOR_ENQUEUE');
export const getTaskForEnqueue = createAction(
  SELECT_QUEUE_PREFIX + 'GET_TASK_FOR_ENQUEUE',
  props<{taskIds: string[]}>()
);
export const setTaskForEnqueue = createAction(
  SELECT_QUEUE_PREFIX + 'SET_TASK_FOR_ENQUEUE',
  props<{ tasks: Task[] }>()
);
export const setQueuesForEnqueue= createAction(
  SELECT_QUEUE_PREFIX + 'SET_QUEUES_FOR_ENQUEUE',
  props<{queues: Queue[]}>()
);
