import {VIEW_PREFIX} from '~/app.constants';
import {Action, createAction, props} from '@ngrx/store';
import {omit} from 'lodash-es';
import {HttpErrorResponse} from '@angular/common/http';
import {Ace} from 'ace-builds';
import {MessageSeverityEnum} from '@common/constants';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';

export const setAutoRefresh = createAction(
  VIEW_PREFIX + '[set auto refresh]',
  props<{ autoRefresh: boolean }>()
);
export const toggleCardsCollapsed = createAction(
  VIEW_PREFIX + '[toggle table cards collapsed]',
  props<{ entityType: EntityTypeEnum }>()
);
export const setCompareAutoRefresh = createAction(
  VIEW_PREFIX + '[set compare auto refresh]',
  props<{ autoRefresh: boolean }>()
);

export const setServerError = createAction(
  VIEW_PREFIX + '[set server error]',
  (serverError: HttpErrorResponse, contextSubCode?: number, customMessage?: string, aggregateSimilar = false, errorHeader?: string) => ({
    serverError: omit(serverError, ['headers']) as Omit<HttpErrorResponse, 'headers'>,
    contextSubCode,
    customMessage,
    aggregateSimilar,
    errorHeader
  })
);


export const setNotificationDialog = createAction(
  VIEW_PREFIX + '[set notification dialog]',
  props<{ notification: { message: string; title: string } }>()
);

export const resetLoader = createAction(VIEW_PREFIX + '[reset loader]');

export const setBackdrop = createAction(
  VIEW_PREFIX + '[set backdrop]',
  props<{ active: boolean }>()
);

export const activeLoader = createAction(
  VIEW_PREFIX + '[activate loader]',
  (endpoint: string) => ({endpoint, noPreferences: true})
);

export const showEmbedReportMenu = createAction(
  VIEW_PREFIX + '[show embed report menu]',
  props<{ show: boolean; position: { x: number; y: number } }>()
);

export const deactivateLoader = createAction(
  VIEW_PREFIX + '[deactivate loader]',
  (endpoint: string) => ({endpoint, noPreferences: true})
);


export const visibilityChanged = createAction(
  VIEW_PREFIX + '[visibility changed]',
  props<{ visible: boolean }>()
);

export const userThemeChanged = createAction(
  VIEW_PREFIX + '[user theme changed]',
  props<{ theme: 'light' | 'dark' | 'system' }>()
);

export const systemThemeChanged = createAction(
  VIEW_PREFIX + '[system theme changed]',
  props<{ theme: 'light' | 'dark' }>()
);

export const setForcedTheme = createAction(
  VIEW_PREFIX + '[set forced theme]',
  props<{ theme: 'light' | 'dark'; default?: 'light' | 'dark' }>()
);

export const setThemeColors = createAction(
  VIEW_PREFIX + '[set theme colors]',
  props<{ colors: Record<string, string> }>()
);

export const saveAceCaretPosition = createAction(
  VIEW_PREFIX + '[save ace caret position]',
  props<{ id: string; position: Ace.Point }>()
);

export const resetAceCaretsPositions = createAction(VIEW_PREFIX + '[reset ace carets positions]');


export const addMessage = createAction(
  VIEW_PREFIX + '[add message]',
  (
    severity: MessageSeverityEnum,
    msg: string,
    userActions?: {
      actions: Action[];
      name: string
    }[],
    suppressNextMessages?: boolean
  ) => ({severity, msg, userActions, suppressNextMessages})
);

export const removeMessage = createAction(VIEW_PREFIX + '[remove message]');

export const setServerUpdatesAvailable = createAction(
  VIEW_PREFIX + '[set server updates available]',
  props<{ availableUpdates }>()
);

export const setScaleFactor = createAction(
  VIEW_PREFIX + '[set scale]',
  props<{ scale: number }>()
);

export const firstLogin = createAction(
  VIEW_PREFIX + '[set first Login]',
  props<{ first: boolean }>()
);

export const neverShowPopupAgain = createAction(VIEW_PREFIX + 'NEVER_SHOW_POPUP_AGAIN', props<{
  popupId: string;
  reset?: boolean
}>());
export const neverShowChangesAgain = createAction(VIEW_PREFIX + 'NEVER_SHOW_CHANGES_AGAIN', props<{
  version: string
}>());
export const setRedactedArguments = createAction(VIEW_PREFIX + 'SET_REDACTED_ARGUMENTS', props<{
  redactedArguments: { key: string } []
}>());
export const setHideRedactedArguments = createAction(VIEW_PREFIX + 'SET_SHOW_REDACTED_ARGUMENTS', props<{
  hide: boolean
}>());
export const plotlyReady = createAction(VIEW_PREFIX + '[plotly ready]');
export const aceReady = createAction(VIEW_PREFIX + '[ace ready]');
export const openAppsAwarenessDialog = createAction(VIEW_PREFIX + '[apps awareness dialog]');
export const setHideEnterpriseFeatures = createAction(
  VIEW_PREFIX + '[setHideEnterpriseFeatures]',
  props<{hide: boolean}>()
)
