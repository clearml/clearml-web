import * as actions from '../actions/common-experiments-info.actions';
import {
  activateEdit,
  deactivateEdit,
  deleteHyperParamsSection,
  downloadArtifacts,
  downloadFailed,
  downloadSuccess,
  experimentDataUpdated,
  experimentDetailsUpdated,
  getExperimentArtifacts,
  getExperimentUncommittedChanges,
  resetExperimentInfo,
  saveExperiment,
  saveExperimentConfigObj,
  saveExperimentSection,
  saveHyperParamsSection,
  setExperiment,
  setExperimentArtifacts,
  setExperimentErrors,
  setExperimentFormErrors,
  setExperimentInfoData,
  setExperimentSaving,
  setExperimentUncommittedChanges,
  setLastTasksTab,
  setSelectedPipelineStep,
  updateExperimentAtPath,
  updateExperimentInfoData
} from '../actions/common-experiments-info.actions';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import {set} from 'lodash-es';
import {removeTagSuccess, setControllerForStartPipelineDialog} from '../actions/common-experiments-menu.actions';
import {ActionCreator, createReducer, on, ReducerTypes} from '@ngrx/store';


export interface CommonExperimentInfoState {
  selectedExperiment: IExperimentInfo;
  selectedPipelineStep: IExperimentInfo;
  pipelineRunDialogTask: IExperimentInfo;
  infoData: IExperimentInfo;
  errors: Record<string, any> | null;
  showExtraDataSpinner: boolean;
  activeSectionEdit: boolean;
  saving: boolean;
  currentActiveSectionEdit: string;
  infoDataFreeze: IExperimentInfo;
  artifactsExperimentId: string;
  downloading: boolean;
  downloadingExperimentOperationLog: boolean;
  lastTab: Record<string, string>;
}

export const initialCommonExperimentInfoState: CommonExperimentInfoState = {
  selectedExperiment: null,
  selectedPipelineStep: null,
  pipelineRunDialogTask:null,
  infoData: null,
  errors: {
    model: null,
    execution: null,
  },
  showExtraDataSpinner: false,
  activeSectionEdit: false,
  saving: false,
  currentActiveSectionEdit: null,
  infoDataFreeze: null,
  artifactsExperimentId: null,
  downloading: false,
  downloadingExperimentOperationLog: false,
  lastTab: null
};

export const commonExperimentInfoReducers = [
  on(setExperiment, (state, action): CommonExperimentInfoState => ({...state, selectedExperiment: action.experiment})),
  on(setExperimentFormErrors, (state, action): CommonExperimentInfoState => ({...state, errors: action.errors})),
  on(experimentDataUpdated, (state, action): CommonExperimentInfoState => ({...state, infoData: {...state.infoData, ...action.changes}})),
  on(saveExperiment, saveHyperParamsSection, saveExperimentConfigObj, deleteHyperParamsSection, saveExperimentSection,
    (state): CommonExperimentInfoState => ({...state, saving: true})),
  on(activateEdit, (state, action): CommonExperimentInfoState => ({
    ...state,
    activeSectionEdit: true,
    infoDataFreeze: state.infoData,
    currentActiveSectionEdit: action.section
  })),
  on(deactivateEdit, (state): CommonExperimentInfoState => ({...state, activeSectionEdit: false, currentActiveSectionEdit: null})),
  on(experimentDetailsUpdated, (state, action): CommonExperimentInfoState => ({...state, infoData: {...state.infoData, ...action.changes}})),
  on(setExperimentSaving, (state, action): CommonExperimentInfoState => ({...state, saving: action.saving})),
  on( setSelectedPipelineStep, (state, action): CommonExperimentInfoState => ({...state, selectedPipelineStep: action.step})),
  on(setControllerForStartPipelineDialog, (state, action): CommonExperimentInfoState => ({...state, pipelineRunDialogTask: action.task})),
  on(updateExperimentAtPath, (state, action): CommonExperimentInfoState => ({...state, infoData: set(state.infoData, action.value, action.path) as IExperimentInfo})),
  on(getExperimentArtifacts, (state): CommonExperimentInfoState => ({...state, saving: false})),
  on(setLastTasksTab, (state, {projectId, lastTab}): CommonExperimentInfoState => ({...state, lastTab: {...state.lastTab, [projectId]: lastTab}})),
  on(downloadArtifacts, (state): CommonExperimentInfoState => ({...state, downloading: true})),
  on(downloadSuccess, downloadFailed, (state): CommonExperimentInfoState => ({...state, downloading: false})),
  on(setExperimentErrors, (state, action): CommonExperimentInfoState => ({...state, errors: {...state.errors, ...action}})),
  on(resetExperimentInfo, (state): CommonExperimentInfoState => ({...state, infoData: null})),
  on(setExperimentInfoData, (state, action): CommonExperimentInfoState => ({
    ...state,
    infoData: {
      ...action.experiment,
      configuration: state.infoData?.configuration,
      execution: {...action.experiment?.execution, diff: state.infoData?.execution?.diff},
      model: state.infoData?.model
    }
  })),
  on(updateExperimentInfoData, (state, action): CommonExperimentInfoState => ({
    ...state,
    selectedExperiment: {...state.selectedExperiment, ...action.changes},
    infoData: {...state.infoData, ...action.changes}
  })),
  on(getExperimentUncommittedChanges, (state, action): CommonExperimentInfoState => ({
    ...state,
    showExtraDataSpinner: !action.autoRefresh
  })),
  on(setExperimentUncommittedChanges, (state, action): CommonExperimentInfoState => ({
    ...state,
    showExtraDataSpinner: false,
    infoData: {...state?.infoData, execution: {...state?.infoData?.execution, diff: action.diff}}
  })),
  on(setExperimentArtifacts, (state, action): CommonExperimentInfoState => ({
    ...state,
    infoData: {
      ...state?.infoData,
      model :(action as ReturnType<typeof actions.setExperimentArtifacts>).model,
    },
    artifactsExperimentId: (action as ReturnType<typeof actions.setExperimentArtifacts>).experimentId
  })),
  on(removeTagSuccess, (state, action): CommonExperimentInfoState => ({
    ...state,
    ...(action.experiments.includes(state.selectedExperiment?.id) && {selectedExperiment: {
        ...state.selectedExperiment,
        tags: state.selectedExperiment.tags?.filter(tag => tag !== action.tag)
      }})
  }))
] as ReducerTypes<CommonExperimentInfoState, ActionCreator[]>[];

export const commonExperimentInfoReducer = createReducer(
  initialCommonExperimentInfoState,
  ...commonExperimentInfoReducers
);
