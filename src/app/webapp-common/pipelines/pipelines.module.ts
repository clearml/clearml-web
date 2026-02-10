import {InjectionToken, NgModule} from '@angular/core';
import {CommonProjectsModule} from '@common/projects/common-projects.module';
import {StoreConfig, StoreModule} from '@ngrx/store';
import {projectsReducer, ProjectsState} from '~/features/projects/projects.reducer';
import {merge} from 'lodash-es';
import {PipelinesPageComponent} from '@common/pipelines/pipelines-page/pipelines-page.component';
import {FeaturesEnum} from '~/business-logic/model/users/featuresEnum';
import {CrumbTypeEnum} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {RouterModule, Routes} from '@angular/router';


export const pipelinesSyncedKeys = [
  'projects.showPipelineExamples',
];

export const PIPELINES_CONFIG_TOKEN =
  new InjectionToken<StoreConfig<ProjectsState, any>>('PipelineConfigToken');


const localStorageKey = '_saved_pipeline_state_';

const getPipelineConfig = () => ({
  metaReducers: [reducer => {
    let onInit = true;
    return (state, action) => {
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

const routes = [{
  path: '',
  component: PipelinesPageComponent,
  data: {search: true, features: FeaturesEnum.Pipelines, staticBreadcrumb:[[{
      name: 'PIPELINES',
      type: CrumbTypeEnum.Feature
    }]]},
}] as Routes;


@NgModule({
  imports: [
    CommonProjectsModule,
    RouterModule.forChild(routes),
    StoreModule.forFeature('projects', projectsReducer, PIPELINES_CONFIG_TOKEN),
  ],
  providers: [
    {provide: PIPELINES_CONFIG_TOKEN, useFactory: getPipelineConfig},
  ]
})
export class PipelinesModule {
}
