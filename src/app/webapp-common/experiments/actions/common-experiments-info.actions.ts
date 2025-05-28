import {createAction, props} from '@ngrx/store';
import {Task} from '~/business-logic/model/tasks/task';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import {IExperimentModelInfo, ITableExperiment} from '../shared/common-experiment-model.model';
import {ParamsItem} from '~/business-logic/model/tasks/paramsItem';
import {ConfigurationItem} from '~/business-logic/model/tasks/configurationItem';
import {ExperimentInfoState} from '~/features/experiments/reducers/experiment-info.reducer';
import {ActivatedRoute} from '@angular/router';
import {TaskTypeEnum} from '~/business-logic/model/tasks/taskTypeEnum';

export enum StepStatusEnum {
  queued = 'queued',
  pending = 'pending',
  skipped = 'skipped',
  cached = 'cached',
  executed = 'executed',
  running = 'running',
  failed = 'failed',
  aborted = 'aborted',
  completed = 'completed'
}

export interface TreeStep {
  base_task_id: string,
  queue: string,
  parents: string[],
  stage: string,
  isStage: boolean,
  statusCount: Record<string, number>,
  computingTime: number,
  numberOfStepsInStage: number,
  executed: string;
  status: StepStatusEnum;
  job_type: TaskTypeEnum;
  job_started: number;
  job_ended: number;
  job_code_section: string;
  job_id: string;
}

export const EXPERIMENTS_INFO_PREFIX = 'EXPERIMENTS_INFO_';

export const getExperimentInfo = createAction(
  EXPERIMENTS_INFO_PREFIX + 'GET_EXPERIMENT_INFO',
  props<{ id: string; autoRefresh?: boolean }>()
);

export const resetExperimentInfo = createAction(EXPERIMENTS_INFO_PREFIX + 'RESET_EXPERIMENT_INFO');

export const autoRefreshExperimentInfo = createAction(
  EXPERIMENTS_INFO_PREFIX + 'AUTO_REFRESH_EXPERIMENT_INFO',
  props<{ id: string }>()
);

export const setExperiment = createAction(
  EXPERIMENTS_INFO_PREFIX + 'SET_EXPERIMENT',
  props<{ experiment: IExperimentInfo }>()
);

export const experimentUpdatedSuccessfully = createAction(
  EXPERIMENTS_INFO_PREFIX + 'EXPERIMENT_UPDATED_SUCCESSFULLY',
  props<{ id: string }>()
);

export const setExperimentInfoData = createAction(
  EXPERIMENTS_INFO_PREFIX + 'SET_EXPERIMENT_INFO_DATA',
  props<{ experiment: IExperimentInfo }>()
);

export const getExperiment = createAction(
  EXPERIMENTS_INFO_PREFIX + '[set experiment]',
  props<{ experimentId: string; autoRefresh?: boolean }>()
);

export const getExperimentUncommittedChanges = createAction(
  EXPERIMENTS_INFO_PREFIX + '[get uncommitted change]',
  props<{ experimentId: string; autoRefresh?: boolean }>()
);

export const setExperimentUncommittedChanges = createAction(
  EXPERIMENTS_INFO_PREFIX + '[set uncommitted change]',
  props<{ diff: string }>()
);

export const getExperimentArtifacts = createAction(
  EXPERIMENTS_INFO_PREFIX + '[get artifacts]',
  props<{ experimentId: string; autoRefresh?: boolean }>()
);

export const downloadArtifacts = createAction(
  EXPERIMENTS_INFO_PREFIX + '[download artifacts]',
  props<{ url: string; inMemory?: boolean }>()
);
export const downloadSuccess = createAction(EXPERIMENTS_INFO_PREFIX + '[download artifacts success]');
export const downloadFailed = createAction(EXPERIMENTS_INFO_PREFIX + '[download artifacts failed]');

export const setExperimentArtifacts = createAction(
  EXPERIMENTS_INFO_PREFIX + '[set artifacts]',
  props<{ model: IExperimentModelInfo; experimentId: string }>()
);

export const updateExperimentInfoData = createAction(
  EXPERIMENTS_INFO_PREFIX + 'UPDATE_EXPERIMENT_INFO_DATA',
  props<{ id?: ITableExperiment['id']; changes: Partial<IExperimentInfo> }>()
);
export const saveExperimentInputModel = createAction(
  EXPERIMENTS_INFO_PREFIX + '[save input model]', props<{
    modelId: string;
    modelName: string;
    route: ActivatedRoute
  }>());

export const saveHyperParamsSection = createAction(
  EXPERIMENTS_INFO_PREFIX + 'SAVE_HYPERPARAMS', props<{ hyperparams: ParamsItem[] }>());

export const saveExperimentConfigObj = createAction(
  EXPERIMENTS_INFO_PREFIX + 'SAVE_CONFIG_OBJ', props<{ configuration: ConfigurationItem[] }>());

export const deleteHyperParamsSection = createAction(
  EXPERIMENTS_INFO_PREFIX + 'DELETE_HYPERPARAMS_SECTION', props<{ section: string }>());

export const getExperimentConfigurationNames = createAction(
  EXPERIMENTS_INFO_PREFIX + 'GET_CONFIGURATION', props<{ experimentId: string }>());

export const setExperimentSaving = createAction(
  EXPERIMENTS_INFO_PREFIX + 'SET_SAVING', props<{ saving: boolean }>());

export const getExperimentConfigurationObj = createAction(
  EXPERIMENTS_INFO_PREFIX + 'GET_CONFIGURATION_OBJ',
);
export const getPipelineConfigurationObj = createAction(
  EXPERIMENTS_INFO_PREFIX + 'GET_PIPELINE_CONFIGURATION_OBJ',
);

export const getSelectedPipelineStep = createAction(
  EXPERIMENTS_INFO_PREFIX + 'GET_PIPELINE_STEP',
  props<{ id: string }>()
);

export const setSelectedPipelineStep = createAction(
  EXPERIMENTS_INFO_PREFIX + 'SET_PIPELINE_STEP',
  props<{ step: IExperimentInfo }>()
);

export const updateExperimentAtPath = createAction(
  EXPERIMENTS_INFO_PREFIX + 'UPDATE_EXPERIMENT_AT_PATH',
  props<{ path: string; value: any }>()
);

// COMMANDS:

export const experimentDataUpdated = createAction(
  EXPERIMENTS_INFO_PREFIX + 'EXPERIMENT_DATA_UPDATED',
  props<{ id: Task['id']; changes: Partial<IExperimentInfo> }>()
);

export const saveExperiment = createAction(EXPERIMENTS_INFO_PREFIX + 'SAVE_EXPERIMENT');

export const saveExperimentSection = createAction(EXPERIMENTS_INFO_PREFIX + 'EXPERIMENT_SAVE_SECTION',
  props<Task>()
);

export const cancelExperimentEdit = createAction(EXPERIMENTS_INFO_PREFIX + 'EXPERIMENT_CANCEL_EDIT');

export const experimentDetailsUpdated = createAction(
  EXPERIMENTS_INFO_PREFIX + 'EXPERIMENT_DETAILS_UPDATED',
  props<{ id: Task['id']; changes: any }>()
);

export const setExperimentErrors = createAction(
  EXPERIMENTS_INFO_PREFIX + 'SET_EXPERIMENT_ERRORS',
  props<Record<string, ExperimentInfoState['errors']>>()
);

export const activateEdit = createAction(
  EXPERIMENTS_INFO_PREFIX + 'ACTIVATE_EDIT',
  (section: string) => ({section})
);

export const deactivateEdit = createAction(EXPERIMENTS_INFO_PREFIX + 'DEACTIVATE_EDIT');

export const setExperimentFormErrors = createAction(
  EXPERIMENTS_INFO_PREFIX + 'SET_EXPERIMENT_FORM_ERRORS',
  props<{ errors: Record<string, any > }>()
);

export const navigateToDataset = createAction(
  EXPERIMENTS_INFO_PREFIX + 'Navigate to open dataset',
  props<{ datasetId: string }>()
);
