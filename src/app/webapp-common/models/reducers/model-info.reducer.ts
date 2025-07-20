import {
  modelExperimentsTableFilterChanged,
  modelsExperimentsTableClearAllFilters,
  activateModelEdit, cancelModelEdit,
  editModel,
  modelDetailsUpdated,
  resetActiveSection,
  setSavingModel,
  setModelInfo, setPlots, saveMetaData, setLastModelsTab
} from '../actions/models-info.actions';
import {SelectedModel, TableModel} from '../shared/models.model';
import {cloneDeep} from 'lodash-es';
import {ITableExperiment} from '@common/experiments/shared/common-experiment-model.model';
import {FilterMetadata} from 'primeng/api/filtermetadata';
import {createReducer, on} from '@ngrx/store';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import {MetricsPlotEvent} from '~/business-logic/model/events/metricsPlotEvent';
import {modelSelectionChanged} from '@common/models/actions/models-view.actions';
import {removeTagSuccess} from '@common/models/actions/models-menu.actions';

export interface ModelInfoState {
  selectedModel: SelectedModel;
  activeSectionEdit: boolean;
  infoDataFreeze: SelectedModel;
  saving: boolean;
  modelExperiments: ITableExperiment[];
  modelExperimentsTableFilter: Record<string, FilterMetadata>;
  xAxisType: ScalarKeyEnum;
  cachedAxisType: ScalarKeyEnum;
  plots: MetricsPlotEvent[];
  lastTab: Record<string, string>;
}

const initialState: ModelInfoState = {
  selectedModel: null,
  activeSectionEdit: null,
  infoDataFreeze: null,
  saving: false,
  modelExperiments: null,
  modelExperimentsTableFilter: {},
  xAxisType: ScalarKeyEnum.Timestamp,
  cachedAxisType: null,
  plots: null,
  lastTab: null
};

export const modelsInfoReducer = createReducer(
  initialState,
  on(setModelInfo, (state, action): ModelInfoState => ({
    ...state,
    selectedModel: action.model as TableModel,
    infoDataFreeze: initialState.infoDataFreeze
  })),
  on(modelDetailsUpdated, (state, action): ModelInfoState => ({
    ...state,
    selectedModel: {...state.selectedModel, ...action.changes as unknown as SelectedModel},
    infoDataFreeze: initialState.infoDataFreeze,
    activeSectionEdit: null
  })),
  on(activateModelEdit, (state): ModelInfoState =>
    ({...state, activeSectionEdit: true, infoDataFreeze: state.selectedModel})),
  on(cancelModelEdit, (state): ModelInfoState => ({
    ...state,
    selectedModel: state.infoDataFreeze ? cloneDeep(state.infoDataFreeze) : state.selectedModel,
    activeSectionEdit: null
  })),
  on(setSavingModel, (state, action): ModelInfoState => ({...state, saving: action.saving})),
  on(saveMetaData, (state): ModelInfoState => ({...state, saving: true})),
  on(editModel, (state): ModelInfoState => ({...state, activeSectionEdit: null})),
  on(resetActiveSection, (state): ModelInfoState => ({...state, activeSectionEdit: null})),
  on(setPlots, (state, action): ModelInfoState => ({...state, plots: action.plots})),
  on(modelSelectionChanged, (state, ): ModelInfoState => ({...state, selectedModel: initialState.selectedModel })),
  on(modelExperimentsTableFilterChanged, (state, action): ModelInfoState => ({
    ...state,
    modelExperimentsTableFilter: {
      ...state.modelExperimentsTableFilter,
      [action.filter.col]: {value: action.filter.value, matchMode: action.filter.filterMatchMode}
    }
  })),
  on(modelsExperimentsTableClearAllFilters, (state): ModelInfoState =>
    ({...state, modelExperimentsTableFilter: initialState.modelExperimentsTableFilter,})
  ),
  on(setLastModelsTab, (state, {projectId, lastTab}): ModelInfoState => ({...state, lastTab: {...state.lastTab, [projectId]: lastTab}})),
  on(removeTagSuccess, (state, action): ModelInfoState => ({
    ...state,
    ...(action.models.includes(state.selectedModel.id) && {selectedExperiment: {
        ...state.selectedModel,
        tags: state.selectedModel.tags?.filter(tag => tag !== action.tag)
      }})
  }))

);

