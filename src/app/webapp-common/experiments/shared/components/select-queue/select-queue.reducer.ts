import {createFeature, createReducer, on} from '@ngrx/store';
import {SelectQueue, setQueuesForEnqueue, setTaskForEnqueue} from './select-queue.actions';
import {Task} from '~/business-logic/model/tasks/task';

interface SelectQueueState {
  queues: SelectQueue[];
  tasks: Task[];
}

const selectQueueInitState: SelectQueueState = {
  queues: null,
  tasks: null
};


export const selectQueueFeature = createFeature({
  name: 'selectQueue',
  reducer: createReducer(
    selectQueueInitState,
    on(setQueuesForEnqueue, (state, action): SelectQueueState => ({...state, queues: action.queues})),
    on(setTaskForEnqueue, (state, action): SelectQueueState => ({...state, tasks: action.tasks})),
  )
});
