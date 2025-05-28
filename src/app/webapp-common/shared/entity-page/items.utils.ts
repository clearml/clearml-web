import {TaskStatusEnum} from '~/business-logic/model/tasks/taskStatusEnum';
import {ModelsArchiveManyResponse} from '~/business-logic/model/models/modelsArchiveManyResponse';
import {TasksArchiveManyResponse} from '~/business-logic/model/tasks/tasksArchiveManyResponse';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {addMessage} from '@common/core/actions/layout.actions';
import {openMoreInfoPopup} from '@common/core/actions/projects.actions';
import {TaskTypeEnum} from '~/business-logic/model/tasks/taskTypeEnum';
import {Task} from '~/business-logic/model/tasks/task';
import {TASKS_STATUS} from '@common/tasks/tasks.constants';
import {TASK_TYPES} from '~/app.constants';
import {isReadOnly} from '@common/shared/utils/is-read-only';

export interface CountAvailableAndIsDisable {
  available: number;
  disable: boolean;
}

export interface CountAvailableAndIsDisableSelectedFiltered extends CountAvailableAndIsDisable {
  selectedFiltered: any[];
}

export const countAvailableAndIsDisable = (selectedFiltered: any[]) => ({
  available: selectedFiltered.length,
  disable: selectedFiltered.length === 0
});

export const selectionHasExample = (selectedElements: any[]) => selectedElements.some((exp => isReadOnly(exp)));
export const selectionAllHasExample = (selectedElements: any[]) => selectedElements.every((exp => isReadOnly(exp)));
export const selectionAllIsArchive = (selectedElements: any[]) => selectedElements.every(s => s?.system_tags?.includes('archived'));
export const selectionIsArchive = (selectedElements: any) => selectedElements?.system_tags?.includes('archived');
export const selectionExamplesCount = (selectedElements: any) => selectedElements.filter((exp => isReadOnly(exp)));
export const canEnqueue = (task: Task): boolean =>
  !!(task && (TASKS_STATUS.CREATED === task.status || TASKS_STATUS.STOPPED === task.status) && task.type !== TASK_TYPES.MANUAL_ANNOTATION);

export const canRetry = (task: Task): boolean =>
  !!(task && TASKS_STATUS.FAILED === task.status && task.type !== TASK_TYPES.MANUAL_ANNOTATION);

export const canDequeue = (task: Task): boolean =>
  !!(task && TASKS_STATUS.QUEUED === task.status);

export const canContinue = (task: Task): boolean =>
  !!(task && [TASKS_STATUS.CREATED, TASKS_STATUS.STOPPED].includes(task.status) && task.type !== TASK_TYPES.MANUAL_ANNOTATION) && !!task.execution?.queue;

export const selectionDisabledAbort = (selectedElements: any[]) => {
  const selectedFiltered = selectedElements.filter((_selected) => [TaskStatusEnum.Queued, TaskStatusEnum.InProgress].includes(_selected?.status) && !isReadOnly(_selected));
  return {selectedFiltered, ...countAvailableAndIsDisable(selectedFiltered)};
};
export const selectionDisabledPublishExperiments = (selectedElements: any[]) => {
  const selectedFiltered = selectedElements.filter(_selected => ([TaskStatusEnum.Stopped, TaskStatusEnum.Closed, 'completed', TaskStatusEnum.Failed].includes(_selected?.status) && !isReadOnly(_selected)));
  return {selectedFiltered, ...countAvailableAndIsDisable(selectedFiltered)};
};
export const selectionDisabledPublishModels = (selectedElements: any[]) => {
  const selectedFiltered = selectedElements.filter(_selected => (!isReadOnly(_selected) && !_selected?.ready));
  return {selectedFiltered, ...countAvailableAndIsDisable(selectedFiltered)};
};

export const selectionDisabledReset = (selectedElements: any[]) => {
  const selectedFiltered = selectedElements.filter(_selected => ![TaskStatusEnum.Created, TaskStatusEnum.Published, TaskStatusEnum.Publishing].includes(_selected?.status) && !isReadOnly(_selected));
  return {selectedFiltered, ...countAvailableAndIsDisable(selectedFiltered)};
};

export const selectionDisabledAbortAllChildren = (selectedElements: any[]) => {
  const selectedFiltered = selectedElements.filter(_selected => [TaskTypeEnum.Controller, TaskTypeEnum.Optimizer].includes(_selected?.type) && !isReadOnly(_selected));
  return {selectedFiltered, ...countAvailableAndIsDisable(selectedFiltered)};
};
export const selectionDisabledDelete = (selectedElements: any[]) => {
  const selectedFiltered = selectedElements.filter(_selected => selectionIsArchive(_selected) && !isReadOnly(_selected));
  return {selectedFiltered, ...countAvailableAndIsDisable(selectedFiltered)};
};
export const selectionDisabledMoveTo = (selectedElements: any[]) => {
  const selectedFiltered = selectedElements.filter(_selected => !isReadOnly(_selected));
  return {selectedFiltered, ...countAvailableAndIsDisable(selectedFiltered)};
};
export const selectionDisabledQueue = (selectedElements: { id?: string; status?: string }[]) => {
  if (selectedElements.length > 1) {
    return {selectedFiltered: [], disable: true, available: 0};
  }
  const selectedFiltered = selectedElements.filter(_selected => _selected?.status === TaskStatusEnum.Queued && !isReadOnly(_selected));
  return {selectedFiltered, ...countAvailableAndIsDisable(selectedFiltered)};
};
export const selectionDisabledViewWorker = (selectedElements: any[]) => {
  if (selectedElements.length > 1) {
    return {selectedFiltered: [], disable: true, available: 0};
  }
  const selectedFiltered = selectedElements.filter(_selected => _selected?.status === TaskStatusEnum.InProgress && !isReadOnly(_selected));
  return {selectedFiltered, ...countAvailableAndIsDisable(selectedFiltered)};
};
export const selectionDisabledContinue = (selectedElements: any[]) => {
  const selectedFiltered = selectedElements.filter(_selected => canContinue(_selected) && !isReadOnly(_selected));
  return {selectedFiltered, ...countAvailableAndIsDisable(selectedFiltered)};
};
export const selectionDisabledEnqueue = (selectedElements: any[]) => {
  const selectedFiltered = selectedElements.filter(_selected => canEnqueue(_selected) && !isReadOnly(_selected));
  return {selectedFiltered, ...countAvailableAndIsDisable(selectedFiltered)};
};
export const selectionDisabledPipelineRun = (selectedElements: any[]) => {
  const selectedFiltered = selectedElements.filter(_selected => !isReadOnly(_selected));
  return {selectedFiltered, ...countAvailableAndIsDisable(selectedFiltered)};
};
export const selectionDisabledRetry = (selectedElements: any[]) => {
  const selectedFiltered = selectedElements.filter(_selected => canRetry(_selected) && !isReadOnly(_selected));
  return {selectedFiltered, ...countAvailableAndIsDisable(selectedFiltered)};
};
export const selectionDisabledDequeue = (selectedElements: any[]) => {
  const selectedFiltered = selectedElements.filter(_selected => canDequeue(_selected) && !isReadOnly(_selected));
  return {selectedFiltered, ...countAvailableAndIsDisable(selectedFiltered)};
};
export const selectionDisabledArchive = (selectedElements: any[]) => {
  const selectedFiltered = selectedElements.filter(_selected => !isReadOnly(_selected));
  return {selectedFiltered, ...countAvailableAndIsDisable(selectedFiltered)};
};
export const selectionDisabledTags = (selectedElements: any[]) => {
  const selectedFiltered = selectedElements.filter(_selected => !isReadOnly(_selected));
  return {selectedFiltered, ...countAvailableAndIsDisable(selectedFiltered)};
};

export const selectionTags = <T extends { tags?: string[] }>(selectedElements: T[]): string[] => {
  const _selectedTags = {};
  selectedElements.forEach(_selected => {
    _selected?.tags?.forEach(tag => {
      if (!_selectedTags[tag]) {
        _selectedTags[tag] = 1;
      } else {
        _selectedTags[tag]++;
      }
    });
  });
  return Object.entries(_selectedTags)
    .filter(([, amount]) => amount === selectedElements.length)
    .map(([tag]) => tag);
};

export enum MenuItems {
  abort = 'abort',
  abortAllChildren = 'abortAllChildren',
  run = 'runPipeline',
  archive = 'archive',
  compare = 'compare',
  delete = 'delete',
  enqueue = 'enqueue',
  dequeue = 'dequeue',
  queue = 'queue',
  moveTo = 'moveTo',
  publish = 'publish',
  reset = 'reset',
  viewWorker = 'viewWorker',
  tags = 'tags',
  showAllItems = 'showAllItems',
  continue = 'continue',
  retry = 'retry'
}

export enum MoreMenuItems {
  restore = 'restore'
}

export type AllMenuItems = MenuItems | MoreMenuItems;

const pastify = (verb: AllMenuItems): string => {
  switch (verb) {
    case MenuItems.abort:
      return 'aborted';
    case MenuItems.archive:
      return 'archived';
    case MoreMenuItems.restore:
      return 'restored';
    case MenuItems.delete:
      return 'deleted';
    case MenuItems.dequeue:
      return 'dequeued';
    case MenuItems.enqueue:
      return 'enqueued';
    case MenuItems.reset:
      return 'reset';
    case MenuItems.publish:
      return 'published';
    default:
      return verb;
  }
};

export const getNotificationAction = (res: ModelsArchiveManyResponse | TasksArchiveManyResponse, action, operationName: AllMenuItems, entityType: EntityTypeEnum, notificationActions = []) => {
  const totalNum = res.failed.length + res.succeeded.length;
  const allFailed = res.succeeded.length === 0;

  const message = allFailed ? `${totalNum === 1 ? '' : totalNum} ${entityType}${totalNum > 1 ? 's' : ''} failed to ${operationName}` :
    `${totalNum === 1 ? '' : res.succeeded.length} ${totalNum > res.succeeded.length ? 'of ' + totalNum : ''} ${entityType}${res.succeeded.length > 1 ? 's' : ''} ${pastify(operationName)} successfully`;

  return addMessage(res.failed.length > 0 ? 'error' : 'success', message, [
    res.failed.length > 0 ? {actions: [openMoreInfoPopup({parentAction: action, operationName, res, entityType: EntityTypeEnum[entityType]})], name: 'More info'} : null,
    ...notificationActions
  ].filter(a => a));
};
