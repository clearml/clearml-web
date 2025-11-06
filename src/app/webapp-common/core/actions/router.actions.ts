import {NAVIGATION_PREFIX} from '~/app.constants';
import {createAction, createActionGroup, emptyProps, props} from '@ngrx/store';
import {Params} from '@angular/router';
import {FilterMetadata} from 'primeng/api';
import {SortMeta} from 'primeng/api';
import {CrumbTypeEnum, IBreadcrumbsLink} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {HeaderNavbarTabConfig} from '@common/layout/header-navbar-tabs/header-navbar-tabs-config.types';

export const BREADCRUMBS_PREFIX = 'BREADCRUMBS_';

export const setRouterSegments = createAction(
  NAVIGATION_PREFIX + 'SET_ROUTER_SEGMENT',
  props<{
    url: string;
    params: Params;
    queryParams: Params;
    config: string[];
    data: any;
  }>()
);

export const setURLParams = createAction(
  NAVIGATION_PREFIX + 'SET_URL_PARAMS',
  props<{
    columns?: string[];
    orders?: SortMeta[];
    filters?: Record<string, FilterMetadata>;
    gsFilters?: Record<string, FilterMetadata>;
    isArchived?: boolean;
    isAdvanced?: boolean;
    isDeep?: boolean;
    update?: boolean;
    version?: string;
    others?: Record<string, string>;
  }>()
);

export const setBreadcrumbs = createAction(
  BREADCRUMBS_PREFIX + 'SET_BREADCRUMBS',
  props<{ breadcrumbs: IBreadcrumbsLink[][], workspaceNeutral?: boolean}>()
);

export const setTypeBreadcrumbs = createAction(
  BREADCRUMBS_PREFIX + 'SET_TYPE_BREADCRUMBS',
  props<{ breadcrumb: IBreadcrumbsLink; type?: CrumbTypeEnum }>()
);

export const setWorkspaceNeutral = createAction(
  BREADCRUMBS_PREFIX + 'set workspace neutral',
  props<{ neutral: boolean }>()
);

export const headerActions = createActionGroup({
  source: 'header tabs',
  events: {
    reset: emptyProps(),
    setTabs: props<{ contextMenu: HeaderNavbarTabConfig[], active: string}>(),
    setActiveTab: props<{ activeFeature: string}>()
  }
});
