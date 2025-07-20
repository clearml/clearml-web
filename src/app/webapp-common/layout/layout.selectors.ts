import {createSelector} from '@ngrx/store';
import {selectRouterConfig, selectRouterQueryParams} from '@common/core/reducers/router-reducer';

export const selectProjectsFeature = createSelector(selectRouterConfig, config => config?.[0] === 'projects');
export const selectHasProjectId = createSelector(selectRouterConfig, config => config?.includes(':projectId'));

export const selectArchive = createSelector(selectRouterQueryParams, params => params?.archive === 'true');
export const selectFeatureParam = createSelector(selectRouterConfig, config => config?.[0]);
