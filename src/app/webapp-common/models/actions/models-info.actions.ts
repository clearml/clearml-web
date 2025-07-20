import {createAction, props} from '@ngrx/store';
import {MetricsPlotEvent} from '~/business-logic/model/events/metricsPlotEvent';
import {Model} from '~/business-logic/model/models/model';
import {SelectedModel} from '../shared/models.model';
import {ModelsUpdateRequest} from '~/business-logic/model/models/modelsUpdateRequest';
import {IModelMetadataMap} from '../containers/model-info-metadata/model-info-metadata.component';
import {TableFilter} from '@common/shared/utils/tableParamEncode';


const MODELS_PREFIX = 'MODELS_INFO_';

export const getModelInfo = createAction(
  MODELS_PREFIX + 'GET_MODEL_INFO',
  props<{id: string}>()
);

export const getModel = createAction(
  MODELS_PREFIX + '[get model]',
  props<{ modelId: string; autoRefresh?: boolean}>()
);

export const setModelInfo = createAction(
  MODELS_PREFIX + 'SET_MODEL_INFO',
  props<{model: SelectedModel}>()
);

export const activateModelEdit = createAction(
  MODELS_PREFIX + 'ACTIVATE_EDIT',
  name => ({name})
);

export const cancelModelEdit = createAction( MODELS_PREFIX + '[cancel edit]');

export const refreshModelInfo = createAction(
  MODELS_PREFIX + 'REFRESH_MODEL_INFO',
  id => ({id})
);

export const editModel = createAction(
  MODELS_PREFIX + 'EDIT_MODEL',
  props<{model: SelectedModel}>()
);

export const setSavingModel = createAction(
  MODELS_PREFIX + '[Set saving Model]',
  savin => ({saving: savin})
);

export const modelDetailsUpdated = createAction(
  MODELS_PREFIX + 'MODEL_DETAILS_UPDATED',
  props<{ id: Model['id']; changes: Partial<ModelsUpdateRequest> }>()
);

export const updateModelDetails = createAction(
  MODELS_PREFIX + '[update model details]',
  props<{ id: string; changes: Partial<ModelsUpdateRequest> }>()
);

export const saveMetaData = createAction(
  MODELS_PREFIX + '[save model metadata]',
  props<{ metadata: IModelMetadataMap }>()
);



export const resetActiveSection = createAction(
  MODELS_PREFIX + '[reset active section]'
);

export const modelsExperimentsTableClearAllFilters = createAction(
  MODELS_PREFIX + '[model experiments clear all filters]'
);

export const modelExperimentsTableFilterChanged = createAction(
  MODELS_PREFIX + '[model experiments table filter changed]',
  props<{ filter: TableFilter }>()
);

export const getPlots = createAction(
  MODELS_PREFIX + '[get plots]',
  props<{id: string}>()
);

export const setPlots = createAction(
  MODELS_PREFIX + '[set plots]',
  props<{plots: MetricsPlotEvent[]}>()
);

export const setLastModelsTab = createAction(
  MODELS_PREFIX + 'set last tab',
  props<{ projectId: string; lastTab: string }>()
);
