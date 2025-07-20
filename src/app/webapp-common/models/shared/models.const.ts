import {ModelTableColFieldsEnum} from './models.model';


export const MODELS_TABLE_COL_FIELDS = {
  SELECTED: 'selected' as ModelTableColFieldsEnum,
  ID: 'id' as ModelTableColFieldsEnum,
  NAME: 'name' as ModelTableColFieldsEnum,
  TAGS: 'tags' as ModelTableColFieldsEnum,
  CREATED: 'created' as ModelTableColFieldsEnum,
  FRAMEWORK: 'framework' as ModelTableColFieldsEnum,
  READY: 'ready' as ModelTableColFieldsEnum,
  USER: 'users' as ModelTableColFieldsEnum,
  PROJECT: 'project.name' as ModelTableColFieldsEnum,
  TASK: 'task.name' as ModelTableColFieldsEnum,
  COMMENT: 'comment' as ModelTableColFieldsEnum,
  LAST_UPDATE : 'last_update' as ModelTableColFieldsEnum,
};

// Actually framework is a free text foe a long time now
export const MODELS_FRAMEWORK_LABELS = {
  'Caffe': 'Caffe',
  'TensorFlow': 'TensorFlow',
  'PyTorch': 'PyTorch',
  'Keras': 'Keras',
  'Custom': 'Custom'
};
//
export const MODELS_READY_LABELS = {
  'true': 'Published',
  'false': 'Draft'
};

// temp, will be taken from the generated code.
export type ModelTagsEnum = 'archived';

export const MODEL_TAGS = {
  HIDDEN: 'archived' as ModelTagsEnum
};


export const MODELS_ONLY_FIELDS = ['company', 'created','last_change' ,'last_update', 'framework', 'id', 'labels', 'name', 'ready', 'tags', 'system_tags', 'task.name', 'uri', 'user.name', 'parent', 'comment', 'project.name'];
export const MODELS_INFO_ONLY_FIELDS = ['company', 'created','last_change' ,'last_update', 'framework', 'id', 'labels', 'name', 'ready', 'tags', 'system_tags', 'task.name', 'task.project', 'uri', 'user.name', 'parent', 'comment', 'project.name', 'design', 'metadata'];
