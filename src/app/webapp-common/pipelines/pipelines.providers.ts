import {InjectionToken} from '@angular/core';
import {ActionReducer, provideState, StoreConfig} from '@ngrx/store';
import {projectsReducer, ProjectsState} from '~/features/projects/projects.reducer';
import {provideEffects} from '@ngrx/effects';
import {ProjectsEffects} from '~/features/projects/projects.effect';
import {CommonProjectsEffects} from '@common/projects/common-projects.effects';
import {commonDeleteDialogProviders} from '@common/shared/entity-page/entity-delete/common-delete-dialog.providers';
import {selectQueueProviders} from '@common/experiments/shared/components/select-queue/select-queue.providers';
import {merge} from 'lodash-es';

export const pipelinesSyncedKeys = [
  'projects.showPipelineExamples',
];

export const PIPELINES_CONFIG_TOKEN =
  new InjectionToken<StoreConfig<ProjectsState, any>>('PipelineConfigToken');


const localStorageKey = '_saved_pipeline_state_';

const getPipelineConfig = () => ({
  metaReducers: [ (reducer: ActionReducer<ProjectsState>) => {
    let onInit = true;
    return (state: ProjectsState, action: any) => {
      const nextState = reducer(state, action);
      if (onInit) {
        onInit = false;
        const savedState = JSON.parse(localStorage.getItem(localStorageKey));
        return merge({}, nextState, savedState);
      }
      return nextState;
    };
  }]
});

export const pipelinesProviders = [
  provideState('projects', projectsReducer, PIPELINES_CONFIG_TOKEN),
  provideEffects([ProjectsEffects, CommonProjectsEffects]),
  {provide: PIPELINES_CONFIG_TOKEN, useFactory: getPipelineConfig},
  ...commonDeleteDialogProviders,
  ...selectQueueProviders
];
