import {createReducer, createSelector, on} from '@ngrx/store';
import {Params} from '@angular/router';
import {setRouterSegments} from '@common/core/actions/router.actions';

export interface RouterState {
  url: string;
  params: Params;
  queryParams: Params;
  config: string[];
  skipNextNavigation: boolean;
  data: any;
}

const initRouter: RouterState = {
  url: window.location.pathname,
  params: null,
  queryParams: null,
  config: null,
  skipNextNavigation: false,
  data: null
};

export const selectRouter = state => state.router as RouterState;
export const selectRouterUrl = createSelector(selectRouter, router => router?.url);
export const selectRouterParams = createSelector(selectRouter, router => router?.params ?? {});
export const selectRouterQueryParams = createSelector(selectRouter, router => router && router.queryParams);
export const selectRouterConfig = createSelector(selectRouter, router => router?.config ?? []);
export const selectRouterData = createSelector(selectRouter, router => router?.data ?? {});
export const selectFirstRouterConfig = createSelector(selectRouterConfig, config => config?.[0]);


export const routerReducer = createReducer(initRouter,
  on(setRouterSegments, (state, action): RouterState => ({
    ...state, params: action.params, queryParams: action.queryParams,
    url: action.url, config: action.config, data: action.data
  })),
);
