import {createAction, props} from '@ngrx/store';
import {SelectedModel} from '../shared/models.model';
import {Project} from '~/business-logic/model/projects/project';

const MODELS_PREFIX = '[MODELS_MENU] ';

export const publishModelClicked = createAction(
  MODELS_PREFIX + 'publish model',
  props<{selectedEntities: SelectedModel[]}>()
);

export const changeProjectRequested = createAction(
  MODELS_PREFIX + 'change project requested',
  props<{ selectedModels: SelectedModel[]; project: Project }>()
);

export const addTag = createAction(
  MODELS_PREFIX + 'add tag to model',
  props<{models: SelectedModel[]; tag: string}>()
);

export const removeTag = createAction(
  MODELS_PREFIX + 'remove tag from model',
  props<{models: SelectedModel[]; tag: string}>()
);

export const removeTagSuccess = createAction(
  MODELS_PREFIX + 'remove tag from model success',
  props<{ models: string[]; tag: string }>()
);

export const archiveSelectedModels = createAction(
  MODELS_PREFIX + 'archive selected models',
  props<{selectedEntities: SelectedModel[]; skipUndo: boolean }>()
);

export const restoreSelectedModels = createAction(
  MODELS_PREFIX + 'restore selected models',
  props<{selectedEntities: SelectedModel[]; skipUndo: boolean }>()
);

