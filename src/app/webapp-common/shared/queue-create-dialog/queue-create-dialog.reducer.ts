import {createFeatureSelector, createReducer, createSelector, on} from '@ngrx/store';
import {setCreationStatus, setQueues, resetState} from './queue-create-dialog.actions';
import {Queue} from '@common/workers-and-queues/actions/queues.actions';

export type CreationStatusEnum = 'success' | 'failed' | 'inProgress';
export const CREATION_STATUS = {
  SUCCESS    : 'success' as CreationStatusEnum,
  FAILED     : 'failed' as CreationStatusEnum,
  IN_PROGRESS: 'inProgress' as CreationStatusEnum,
};

export interface ICreateQueueDialog {
  queues: Queue[];
  creationStatus: CreationStatusEnum;
}

const createQueueInitState: ICreateQueueDialog = {
  queues        : [],
  creationStatus: null
};

export const selectCreateQueueDialog = createFeatureSelector<ICreateQueueDialog>('queueCreateDialog');
export const selectQueues            = createSelector(selectCreateQueueDialog, (state) => state.queues);
export const selectCreationStatus    = createSelector(selectCreateQueueDialog, (state): CreationStatusEnum => state.creationStatus);

export const queueCreateDialogReducer = createReducer(
  createQueueInitState,
  on(setQueues, (state, action): ICreateQueueDialog => ({...state, queues: action.queues})),
  on(setCreationStatus, (state, action): ICreateQueueDialog => ({...state, creationStatus: action.status})),
  on(resetState, (): ICreateQueueDialog => ({...createQueueInitState})),
);
