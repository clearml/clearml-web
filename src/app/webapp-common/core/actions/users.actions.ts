import {createAction, props} from '@ngrx/store';
import {USERS_PREFIX} from '~/app.constants';
import {GetCurrentUserResponseUserObjectCompany} from '~/business-logic/model/users/getCurrentUserResponseUserObjectCompany';
import {UsersUpdateRequest} from '~/business-logic/model/users/usersUpdateRequest';

export const fetchCurrentUser = createAction(USERS_PREFIX +'FETCH_USER');
export const updateCurrentUser = createAction(USERS_PREFIX +'UPDATE_USER',
  props<{user: UsersUpdateRequest}>());

export const setCurrentUserName = createAction(USERS_PREFIX + 'SET_CURRENT_USER_NAME',
  props<{name: string}>()
);
export const termsOfUseAccepted = createAction(USERS_PREFIX + '[TOS accepted]');

export const logout = createAction(
  USERS_PREFIX + 'LOGOUT',
  props<{provider?: string; tenant?: string; redirectUrl?: string}>()
);
export const logoutSuccess = createAction(USERS_PREFIX + 'LOGOUT_SUCCESS');

export const setPreferences = createAction(USERS_PREFIX +'SET_PREF', props<{payload: any}>());

export const setActiveWorkspace = createAction(
  USERS_PREFIX + ' set active workspace',
  props<{workspace: GetCurrentUserResponseUserObjectCompany; skipRedirect?: boolean}>()
);
export const setSelectedWorkspaceTab = createAction(
  USERS_PREFIX + ' set selected workspace tab',
  props<{workspace: GetCurrentUserResponseUserObjectCompany}>()
);


export const setFilterByUser =  createAction(
  USERS_PREFIX +'SET_FILTERED_BY_USER',
  props<{showOnlyUserWork: boolean, feature: string}>()
);

export const setUserWorkspacesFromUser = createAction(USERS_PREFIX + ' set user workspaces from current user');
export const getApiVersion = createAction(`${USERS_PREFIX} get api version`  );
export const setApiVersion = createAction(`${USERS_PREFIX} set api version`, props<{serverVersions: {server: string; api: string}}>());

