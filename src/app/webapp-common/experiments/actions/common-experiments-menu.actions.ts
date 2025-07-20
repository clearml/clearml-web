import {createAction, props} from '@ngrx/store';
import {IExperimentInfo, ISelectedExperiment} from '~/features/experiments/shared/experiment-info.model';
import {Project} from '~/business-logic/model/projects/project';
import {Queue} from '~/business-logic/model/queues/queue';
import {CloneExperimentPayload, ITableExperiment} from '../shared/common-experiment-model.model';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';

export const EXPERIMENTS_INFO_PREFIX = '[EXPERIMENTS INFO] ';


export const publishClicked = createAction(
  EXPERIMENTS_INFO_PREFIX + 'publish experiments',
  props<{ selectedEntities: ISelectedExperiment[] }>()
);

export const stopClicked = createAction(
  EXPERIMENTS_INFO_PREFIX + 'stop experiments',
  props<{ selectedEntities: ISelectedExperiment[], includePipelineSteps?: boolean}>()
);
export const startPipeline = createAction(
  EXPERIMENTS_INFO_PREFIX + 'start pipeline',
  props<{ queue: Queue; args: {name: string; value: string}[]; task: string; }>()
);

export const getControllerForStartPipelineDialog = createAction(
  EXPERIMENTS_INFO_PREFIX + 'Get Controller For Start Pipeline',
  props<{task: string}>()
);

export const setControllerForStartPipelineDialog = createAction(
  EXPERIMENTS_INFO_PREFIX + 'Set Controller For Start Pipeline',
  props<{task: IExperimentInfo}>()
);


export const changeProjectRequested = createAction(
  EXPERIMENTS_INFO_PREFIX + 'change project requested',
  props<{ selectedEntities: ISelectedExperiment[]; project: Project }>()
);

export const dequeueClicked = createAction(
  EXPERIMENTS_INFO_PREFIX + 'dequeue experiments',
  props<{ selectedEntities: ISelectedExperiment[] }>()
);

export const cloneExperiment = createAction(
  EXPERIMENTS_INFO_PREFIX + 'CLONE_EXPERIMENT_CLICKED',
  props<{ originExperiment: ISelectedExperiment; cloneData: CloneExperimentPayload }>()
);

export const cloneExperimentSuccess = createAction(
  EXPERIMENTS_INFO_PREFIX + 'CLONE_EXPERIMENT_CLICKED success',
  props<{project: string; task: string}>()
);

export const addTag = createAction(
  EXPERIMENTS_INFO_PREFIX + 'add tag to experiment',
  props<{ experiments: Partial<ITableExperiment>[]; tag: string }>()
);

export const abortAllChildren = createAction(
  EXPERIMENTS_INFO_PREFIX + 'get all tasks children',
  props<{ experiments: ISelectedExperiment[]}>()
);

export const removeTag = createAction(
  EXPERIMENTS_INFO_PREFIX + 'remove tag from experiment',
  props<{ experiments: Partial<ITableExperiment>[]; tag: string }>()
);
export const removeTagSuccess = createAction(
  EXPERIMENTS_INFO_PREFIX + 'remove tag from experiment success',
  props<{ experiments: string[]; tag: string }>()
);
export const shareSelectedExperiments = createAction(
  EXPERIMENTS_INFO_PREFIX + 'share experiments',
  props<{ share: boolean; task: string }>()
);

export const navigateToQueue = createAction(
  EXPERIMENTS_INFO_PREFIX + 'navigate to queue',
  props<{ experimentId: string }>()
);

export const navigateToWorker = createAction(
  EXPERIMENTS_INFO_PREFIX + 'navigate to worker',
  props<{ experimentId: string }>()
);

export const enqueueClicked = createAction(
  EXPERIMENTS_INFO_PREFIX + 'enqueue experiments',
  props<{ selectedEntities: ISelectedExperiment[]; queue: Queue; verifyWatchers: boolean }>()
);
export const openEmptyQueueMessage = createAction(
  EXPERIMENTS_INFO_PREFIX + 'open empty queue message',
  props<{ queue: Queue; entityName?: string }>()
);

export const archiveSelectedExperiments = createAction(
  EXPERIMENTS_INFO_PREFIX + 'archive selected experiments',
  props<{ selectedEntities: ISelectedExperiment[]; skipUndo?: boolean; entityType?: EntityTypeEnum }>()
);

export const restoreSelectedExperiments = createAction(
  EXPERIMENTS_INFO_PREFIX + 'restore selected experiments',
  props<{ selectedEntities: ISelectedExperiment[]; skipUndo?: boolean; entityType?: EntityTypeEnum }>()
);
