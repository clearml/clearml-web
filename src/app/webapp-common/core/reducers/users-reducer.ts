import {ActionCreator, createSelector, on, ReducerTypes} from '@ngrx/store';
import {fetchCurrentUser, logout, setApiVersion, setCurrentUserName, setFilterByUser} from '../actions/users.actions';
import {GetCurrentUserResponseUserObject} from '~/business-logic/model/users/getCurrentUserResponseUserObject';
import {
  GetCurrentUserResponseUserObjectCompany
} from '~/business-logic/model/users/getCurrentUserResponseUserObjectCompany';
import {GettingStarted} from '~/core/actions/users.action';
import {UsersGetCurrentUserResponseSettings} from '~/business-logic/model/users/usersGetCurrentUserResponseSettings';
import {Role as RoleEnum} from '~/business-logic/model/auth/role';
import {selectProjectType} from '@common/core/reducers/view.reducer';
import {
  OrganizationGetUserCompaniesResponseCompanies
} from '~/business-logic/model/organization/organizationGetUserCompaniesResponseCompanies';


export interface UsersState {
  currentUser: GetCurrentUserResponseUserObject;
  activeWorkspace: GetCurrentUserResponseUserObjectCompany;
  userWorkspaces: OrganizationGetUserCompaniesResponseCompanies[];
  selectedWorkspaceTab: GetCurrentUserResponseUserObjectCompany;
  workspaces: GetCurrentUserResponseUserObjectCompany[];
  showOnlyUserWork: Record<string, boolean>;
  serverVersions: { server: string; api: string };
  gettingStarted: GettingStarted;
  settings: UsersGetCurrentUserResponseSettings;
}

export const initUsers: UsersState = {
  currentUser: null,
  activeWorkspace: null,
  userWorkspaces: [],
  selectedWorkspaceTab: null,
  workspaces: [],
  showOnlyUserWork: {},
  serverVersions: null,
  gettingStarted: null,
  settings: null
};

export const users = state => state.users as UsersState;
export const selectSettings = createSelector(users, (state) => state?.settings);
export const selectMaxDownloadItems = createSelector(selectSettings, (state): number => state?.max_download_items ?? 1000);
export const selectCurrentUser = createSelector(users, state => state.currentUser);
export const selectIsAdmin = createSelector(users, state => state.currentUser?.role === RoleEnum.Admin);
export const selectActiveWorkspace = createSelector(users, state => state?.activeWorkspace);
export const selectActiveWorkspaceTier = createSelector(selectActiveWorkspace, workspace => workspace?.tier);
export const selectUserWorkspaces = createSelector(users, state => state.userWorkspaces);
export const selectSelectedWorkspaceTab = createSelector(users, state => state.selectedWorkspaceTab);
export const selectWorkspaces = createSelector(users, state => state.workspaces);
export const selectServerVersions = createSelector(users, state => state.serverVersions);
export const selectGettingStarted = createSelector(users, state => state.gettingStarted);
export const selectWorkspaceOwner = createSelector(selectActiveWorkspace, selectUserWorkspaces, (active, workspaces) => {
  if (workspaces && active) {
    const activeWs = workspaces.find(ws => ws.id === active.id);
    return activeWs?.owners?.[0]?.name || '';
  }
  return null;
});
export const selectIsAdminInActiveWorkspace = createSelector(selectCurrentUser, selectIsAdmin, selectActiveWorkspace, selectUserWorkspaces,
  (user, isAdmin, active, workspaces) => {
    if (active) {
      if (workspaces?.length > 1) {
        const activeWs = workspaces?.find(ws => ws.id === active.id);
        return activeWs?.owners?.some(owner => owner.id === user.id);
      } else {
        return isAdmin;
      }
    }
    return false;
  });
export const selectShowOnlyUserWork = createSelector(users, selectProjectType, (state, projectType) => projectType ? state.showOnlyUserWork[projectType] : false);

export const usersReducerFunctions = [
  on(fetchCurrentUser, state => ({...state})),
  on(setCurrentUserName, (state, action) => ({
    ...state,
    currentUser: {...state.currentUser, name: action.name}
  })),

  on(logout, state => ({
    ...state,
    currentUser: null
  })),
  on(setFilterByUser, (state, action) => {
    return ({...state, showOnlyUserWork: {...state.showOnlyUserWork, [action.feature]: action.showOnlyUserWork}});
  }),
  on(setApiVersion, (state, action) => ({...state, serverVersions: action.serverVersions}))
] as ReducerTypes<UsersState, ActionCreator[]>[];
