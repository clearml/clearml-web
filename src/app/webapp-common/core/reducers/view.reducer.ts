import {ActionCreator, createSelector, on, ReducerTypes} from '@ngrx/store';
import * as layoutActions from '../actions/layout.actions';
import {apiRequest} from '@common/core/actions/http.actions';
import {Ace} from 'ace-builds';
import {IBreadcrumbsLink} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {
  headerActions,
  setBreadcrumbs,
  setTypeBreadcrumbs
} from '@common/core/actions/router.actions';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {HeaderNavbarTabConfig} from '@common/layout/header-navbar-tabs/header-navbar-tabs-config.types';
import {selectRouterConfig} from '@common/core/reducers/router-reducer';
import {activeFeatureToProjectType, routeConfToProjectType} from '~/features/projects/projects-page.utils';
import {setHideEnterpriseFeatures} from '../actions/layout.actions';

export interface ViewState {
  loading: Record<string, boolean>;
  dialog: boolean;
  notification: { title: string; message: string };
  backdropActive: boolean;
  autoRefresh: boolean;
  applicationVisible: boolean;
  scaleFactor: number;
  firstLogin: boolean;
  neverShowPopupAgain: string[];
  neverShowChangesAgain: string;
  plotlyReady: boolean;
  aceReady: boolean;
  aceCaretPosition: Record<string, Ace.Point>;
  showUserFocus: boolean;
  redactedArguments: { key: string }[];
  hideRedactedArguments: boolean;
  showEmbedReportMenu: { show: boolean; position: { x: number; y: number } };
  breadcrumbs: IBreadcrumbsLink[][];
  headerMenu: HeaderNavbarTabConfig[];
  headerMenuActiveFeature: string;
  tableCardsCollapsed: Record<string, boolean>;
  workspaceNeutral: boolean;
  theme: 'light' | 'dark' | 'system';
  systemTheme: 'light' | 'dark';
  defaultTheme: 'light' | 'dark';
  forcedTheme: 'light' | 'dark';
  themeColors: Record<string, string>;
  hideEnterpriseFeatures: boolean;
  extraErrorInfo: Record<string, any>;
}

export const initViewState: ViewState = {
  loading: {},
  dialog: false,
  notification: null,
  backdropActive: false,
  autoRefresh: true,
  applicationVisible: true,
  scaleFactor: 100,
  firstLogin: false,
  neverShowPopupAgain: [],
  neverShowChangesAgain: null,
  plotlyReady: false,
  aceReady: false,
  aceCaretPosition: {},
  showUserFocus: false,
  redactedArguments: [{key: 'CLEARML_API_SECRET_KEY'},
    {key: 'CLEARML_AGENT_GIT_PASS'},
    {key: 'AWS_SECRET_ACCESS_KEY'},
    {key: 'AZURE_STORAGE_KEY'}],
  hideRedactedArguments: false,
  showEmbedReportMenu: {show: null, position: null},
  breadcrumbs: [[{}]],
  tableCardsCollapsed: {},
  headerMenu: null,
  headerMenuActiveFeature: null,
  workspaceNeutral: false,
  theme: null,
  systemTheme: null,
  defaultTheme: null,
  forcedTheme: null,
  themeColors: null,
  hideEnterpriseFeatures: false,
  extraErrorInfo: {},
};

export const views = state => state.views as ViewState;
export const selectLoading = createSelector(views, state => state.loading);
export const selectIsLoading = createSelector(views, (state) => Object.values(state.loading).some((value) => value));

export const selectBackdropActive = createSelector(views, state => state.backdropActive);

export const selectNotification = createSelector(views, state => state.notification);

export const selectAutoRefresh = createSelector(views, state => state?.autoRefresh);
export const selectAppVisible = createSelector(views, state => state?.applicationVisible);
export const selectUserTheme = createSelector(views, state => state?.theme ?? state?.defaultTheme ?? 'system');
export const selectSystemTheme = createSelector(views, state => state?.systemTheme ?? 'dark');
export const selectForcedTheme = createSelector(views, state => state?.forcedTheme);
export const selectThemeColors = createSelector(views, state => state.themeColors);
export const selectThemeMode = createSelector(selectUserTheme, selectSystemTheme, selectForcedTheme,
  (user, system, forced) => forced ?? (user === 'system' ? system : user));
export const selectDarkTheme = createSelector(selectThemeMode, mode => mode === 'dark');
export const selectScaleFactor = createSelector(views, state => state?.scaleFactor);
export const selectFirstLogin = createSelector(views, state => state.firstLogin);
export const selectPlotlyReady = createSelector(views, state => state.plotlyReady);
export const selectAceReady = createSelector(views, state => state.aceReady);
export const selectAceCaretPosition = createSelector(views, state => state.aceCaretPosition);
export const selectNeverShowPopups = createSelector(views, (state): string[] => state.neverShowPopupAgain);
export const selectNeverShowAppChanges = createSelector(views, (state): string => state.neverShowChangesAgain);
export const selectRedactedArguments = createSelector(views, (state): { key: string }[] => state.redactedArguments);
export const selectHideRedactedArguments = createSelector(views, (state): {
  key: string
}[] => state.hideRedactedArguments ? state.redactedArguments : null);
export const selectShowEmbedReportMenu = createSelector(views, state => state.showEmbedReportMenu);
export const selectBreadcrumbs = createSelector(views, state => state && state.breadcrumbs);
export const selectTableCardsCollapsed = (entityType: EntityTypeEnum) => createSelector(views, state => state.tableCardsCollapsed[entityType]);
export const selectHeaderMenu = createSelector(views, state => state?.headerMenu);
export const selectActiveFeature = createSelector(views, state => state && state.headerMenuActiveFeature);
export const selectHeaderMenuIndex = createSelector(selectHeaderMenu, selectActiveFeature,
  (contextMenu, active) => contextMenu?.findIndex(item =>
    item.featureName ?
      item.featureName === active :
      item.link ?
        (Array.isArray(item.link) ? item.link.at(-1) : item.link) === active :
        item.header === active
  )
);
export const selectWorkspaceNeutral = createSelector(views, state => state?.workspaceNeutral);
export const selectProjectType = createSelector(selectRouterConfig, selectActiveFeature,
  (config, activeFeature) => (config && routeConfToProjectType(config)) ?? activeFeatureToProjectType(activeFeature));
export const selectHideEnterpriseFeatures = createSelector(views, state => state.hideEnterpriseFeatures);


export const viewReducers = [
  on(layoutActions.deactivateLoader, (state, action): ViewState => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {[action.endpoint]: removed, ...loading} = state.loading;
    return {...state, loading};
  }),
  on(layoutActions.activeLoader, (state, action): ViewState => ({
    ...state,
    loading: {...state.loading, [action.endpoint]: true}
  })),
  on(layoutActions.visibilityChanged, (state, action): ViewState => ({...state, applicationVisible: action.visible})),
  on(layoutActions.userThemeChanged, (state, action): ViewState => ({...state, theme: action.theme})),
  on(layoutActions.systemThemeChanged, (state, action): ViewState => ({...state, systemTheme: action.theme})),
  on(layoutActions.setForcedTheme, (state, action): ViewState => ({
    ...state,
    forcedTheme: action.theme,
    ...(action.default && {defaultTheme: action.theme})
  })),
  on(layoutActions.setThemeColors, (state, action): ViewState => ({...state, themeColors: action.colors})),
  on(layoutActions.setScaleFactor, (state, action): ViewState => ({...state, scaleFactor: action.scale})),
  on(layoutActions.firstLogin, (state, action): ViewState => ({
    ...state,
    firstLogin: action.first,
  })),
  on(layoutActions.plotlyReady, (state): ViewState => ({...state, plotlyReady: true})),
  on(layoutActions.aceReady, (state): ViewState => ({...state, aceReady: true})),
  on(layoutActions.saveAceCaretPosition, (state, action): ViewState => ({
    ...state,
    aceCaretPosition: {...state.aceCaretPosition, [action.id]: action.position}
  })),
  on(layoutActions.resetAceCaretsPositions, state => ({...state, aceCaretPosition: {}})),
  on(layoutActions.resetLoader, (state): ViewState => ({...state, loading: {}})),
  on(layoutActions.setRedactedArguments, (state, action): ViewState => ({
    ...state,
    redactedArguments: action.redactedArguments
  })),
  on(layoutActions.setHideRedactedArguments, (state, action): ViewState => ({
    ...state,
    hideRedactedArguments: action.hide
  })),
  on(apiRequest, (state, action): ViewState => ({
    ...state,
    loading: {...state.loading, [action?.endpoint || 'default']: true}
  })),
  on(layoutActions.setNotificationDialog, (state, action): ViewState => ({
    ...state,
    notification: action.notification
  })),
  on(layoutActions.setBackdrop, (state, action): ViewState => ({...state, backdropActive: action.active})),
  on(layoutActions.setAutoRefresh, (state, action): ViewState => ({...state, autoRefresh: action.autoRefresh})),
  on(layoutActions.toggleCardsCollapsed, (state, action): ViewState => ({
    ...state,
    tableCardsCollapsed: {
      ...state.tableCardsCollapsed,
      [action.entityType]: !state.tableCardsCollapsed[action.entityType]
    }
  })),
  on(layoutActions.showEmbedReportMenu, (state, action): ViewState => ({
    ...state,
    showEmbedReportMenu: {show: action.show, position: action.position}
  })),
  on(layoutActions.neverShowPopupAgain, (state, action): ViewState => ({
    ...state,
    neverShowPopupAgain: action.reset ? state.neverShowPopupAgain.filter(popups => popups !== action.popupId) : Array.from(new Set([...state.neverShowPopupAgain, action.popupId]))
  })),
  on(layoutActions.neverShowChangesAgain, (state, action): ViewState => ({
    ...state,
    neverShowChangesAgain: action.version
  })),
  on(setBreadcrumbs, (state, action): ViewState => ({
    ...state,
    breadcrumbs: action.breadcrumbs,
    workspaceNeutral: action.workspaceNeutral !== undefined ? action.workspaceNeutral : false
  })),
  on(headerActions.reset, (state): ViewState => ({
    ...state, headerMenuActiveFeature: initViewState.headerMenuActiveFeature, headerMenu: initViewState.headerMenu
  })),
  on(headerActions.setTabs, (state, action): ViewState => ({
    ...state, headerMenu: action.contextMenu, headerMenuActiveFeature: action.active
  })),
  on(headerActions.setActiveTab, (state, action): ViewState => ({
    ...state, headerMenuActiveFeature: action.activeFeature
  })),
  on(setTypeBreadcrumbs, (state, action): ViewState => ({
    ...state,
    breadcrumbs: [...state.breadcrumbs?.map(breadcrumbGroup => [...breadcrumbGroup?.map(breadcrumb => breadcrumb.type === action.type ? action.breadcrumb : breadcrumb) ?? []
    ]) ?? []]
  })),
  on(setHideEnterpriseFeatures, (state, action): ViewState =>
    ({...state, hideEnterpriseFeatures: action.hide})),
] as ReducerTypes<ViewState, ActionCreator[]>[];

