import {provideState} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {projectsReducer} from '~/features/projects/projects.reducer';
import {ProjectsEffects} from '~/features/projects/projects.effect';
import {CommonProjectsEffects} from './common-projects.effects';
import {commonDeleteDialogProviders} from '@common/shared/entity-page/entity-delete/common-delete-dialog.providers';

export const commonProjectsProviders = [
  provideState('projects', projectsReducer),
  provideEffects([ProjectsEffects, CommonProjectsEffects]),
  ...commonDeleteDialogProviders,
];
