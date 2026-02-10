import {createFeatureSelector, createReducer, createSelector, on} from '@ngrx/store';
import {setCreationStatus, setQueues, resetState} from './queue-create-dialog.actions';
import {SelectQueue} from '@common/experiments/shared/components/select-queue/select-queue.actions';

export type CreationStatusEnum = 'success' | 'failed' | 'inProgress';
export const CREATION_STATUS = {
  SUCCESS    : 'success' as CreationStatusEnum,
  FAILED     : 'failed' as CreationStatusEnum,
  IN_PROGRESS: 'inProgress' as CreationStatusEnum,
};

export interface CreateQueueState {
  queues: SelectQueue[];
  creationStatus: CreationStatusEnum;
}

const createQueueInitState: CreateQueueState = {
  queues        : [],
  creationStatus: null
};

export const selectCreateQueue = createFeatureSelector<CreateQueueState>('queueCreateDialog');
export const selectQueues            = createSelector(selectCreateQueue, (state) => state.queues);
export const selectCreationStatus    = createSelector(selectCreateQueue, (state): CreationStatusEnum => state.creationStatus);

export const queueCreateDialogReducer = createReducer(
  createQueueInitState,
  on(setQueues, (state, action): CreateQueueState => ({...state, queues: action.queues})),
  on(setCreationStatus, (state, action): CreateQueueState => ({...state, creationStatus: action.status})),
  on(resetState, (): CreateQueueState => ({...createQueueInitState})),
);
