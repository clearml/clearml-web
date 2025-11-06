import {InjectionToken, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PipelinesPageComponent} from './pipelines-page/pipelines-page.component';
import {CommonProjectsModule} from '@common/projects/common-projects.module';
import {StoreConfig, StoreModule} from '@ngrx/store';
import {projectsReducer, ProjectsState} from '~/features/projects/projects.reducer';
import {ProjectsSharedModule} from '~/features/projects/shared/projects-shared.module';
import {merge} from 'lodash-es';
import {PipelinesRouterModule} from '@common/pipelines/pipelines.route';
import {PipelineCardComponent} from '@common/pipelines/pipeline-card/pipeline-card.component';
import {ButtonToggleComponent} from '@common/shared/ui-components/inputs/button-toggle/button-toggle.component';
import {PushPipe} from '@ngrx/component';
import {DotsLoadMoreComponent} from '@common/shared/ui-components/indicators/dots-load-more/dots-load-more.component';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {FormsModule} from '@angular/forms';



export const pipelinesSyncedKeys = [
  'projects.showPipelineExamples',
];

export const PIPELINES_CONFIG_TOKEN =
  new InjectionToken<StoreConfig<ProjectsState , any>>('PipelineConfigToken');


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



@NgModule({
  declarations: [
    PipelinesPageComponent,
  ],
  imports: [
    CommonModule,
    CommonProjectsModule,
    ProjectsSharedModule,
    PipelinesRouterModule,
    StoreModule.forFeature('projects', projectsReducer, PIPELINES_CONFIG_TOKEN),
    PipelineCardComponent,
    ButtonToggleComponent,
    PushPipe,
    DotsLoadMoreComponent,
    MatButton,
    MatIcon,
    FormsModule,
  ],
  exports: [PipelinesPageComponent],
  providers: [
    {provide: PIPELINES_CONFIG_TOKEN, useFactory: getPipelineConfig},
  ]
})
export class PipelinesModule { }
