import {AUTH_PREFIX} from '@common/core/actions/common-auth.actions';
import {PROJECTS_PREFIX as ROOT_PROJECTS_PREFIX} from '@common/core/actions/projects.actions';
import {createUserPrefReducer} from '@common/core/meta-reducers/user-pref-reducer';
import {messagesReducer} from '@common/core/reducers/messages-reducer';
import {projectsReducer} from '@common/core/reducers/projects.reducer';
import {routerReducer} from '@common/core/reducers/router-reducer';
import {PROJECTS_PREFIX} from '@common/projects/common-projects.consts';
import {CHOOSE_COLOR_PREFIX} from '@common/shared/ui-components/directives/choose-color/choose-color.actions';
import {UserPreferences} from '@common/user-preferences';
import {ActionReducer, MetaReducer} from '@ngrx/store';
import {merge, pick} from 'lodash-es';
import {USERS_PREFIX, VIEW_PREFIX} from '~/app.constants';
import {loginReducer} from '~/features/login/login.reducer';
import {projectSyncedKeys} from '~/features/projects/projects.routes';
import {authReducer} from '~/core/reducers/auth.reducers';
import {usageStatsReducer, userStatsFeatureKey} from './reducers/usage-stats.reducer';
import {usersReducer} from './reducers/users.reducer';
import {viewReducer} from './reducers/view.reducer';
import {recentTasksReducer} from '@common/core/reducers/recent-tasks-reducer';
import {searchReducer} from '@common/common-search/common-search.reducer';
import {colorPreferenceReducer} from '@common/shared/ui-components/directives/choose-color/choose-color.reducer';

export const reducers = {
  auth: authReducer,
  router: routerReducer,
  messages: messagesReducer,
  recentTasks: recentTasksReducer,
  views: viewReducer,
  users: usersReducer,
  login: loginReducer,
  rootProjects: projectsReducer,
  [userStatsFeatureKey]: usageStatsReducer,
  commonSearch: searchReducer,
  colorsPreference: colorPreferenceReducer,
};

const syncedKeys = [
  'auth.s3BucketCredentials',
  'datasets.selectedVersion',
  'datasets.selected',
  'projects.selectedProjectId',
  'projects.selectedProject',
  'rootProjects.showHidden',
  'rootProjects.hideExamples',
  'rootProjects.mainPageTagsFilter',
  'rootProjects.mainPageTagsFilterMatchMode',
  'rootProjects.mainPageUsersFilter',
  'rootProjects.mainPageStatusFilter',
  'rootProjects.defaultNestedModeForFeature',
  'views.availableUpdates',
  'views.showSurvey',
  'views.tableCardsCollapsed',
  'views.contextMenuActiveFeature',
];
const key = '_saved_state_';
export const colorSyncedKeys = [
  'colorPreferences',
];

const actionsPrefix = [AUTH_PREFIX, USERS_PREFIX, ROOT_PROJECTS_PREFIX, VIEW_PREFIX];

if (!localStorage.getItem(key)) {
  localStorage.setItem(key, '{}');
}

export const localStorageReducer = (reducer: ActionReducer<string>): ActionReducer<any> =>
  (state, action) => {
    let nextState = reducer(state, action);
    // TODO: lil hack to fix ngrx bug in preload strategy that dispatch store/init multiple times.
    if (action.type === '@ngrx/store/init') {
      const savedState = JSON.parse(localStorage.getItem(key));
      nextState = merge({}, nextState, savedState);
    }
    if (state === nextState) {
      return nextState;
    }
    if (actionsPrefix && !actionsPrefix.some(ap => action.type.startsWith(ap))) {
      return nextState;
    }
    localStorage.setItem(key, JSON.stringify(pick(nextState, syncedKeys )));
    return nextState;
  };

export const userPrefMetaFactory = (userPreferences: UserPreferences): MetaReducer[] => [
  (reducer: ActionReducer<any>) =>
    createUserPrefReducer('users', ['activeWorkspace', 'showOnlyUserWork'], [USERS_PREFIX], userPreferences, reducer),
  (reducer: ActionReducer<any>) =>
    createUserPrefReducer('rootProjects', ['tagsColors', 'graphVariant', 'showHidden', 'hideExamples', 'defaultNestedModeForFeature', 'blockUserScript'], [ROOT_PROJECTS_PREFIX], userPreferences, reducer),
  (reducer: ActionReducer<any>) =>
    createUserPrefReducer('views', ['autoRefresh', 'neverShowPopupAgain', 'redactedArguments', 'hideRedactedArguments', 'theme', 'hideEnterpriseFeatures'], [VIEW_PREFIX], userPreferences, reducer),
  localStorageReducer,
  (reducer: ActionReducer<any>) =>
    createUserPrefReducer('projects', projectSyncedKeys, [PROJECTS_PREFIX], userPreferences, reducer),
  (reducer: ActionReducer<any>) =>
    createUserPrefReducer('colorsPreference', colorSyncedKeys, [CHOOSE_COLOR_PREFIX], userPreferences, reducer)
];
