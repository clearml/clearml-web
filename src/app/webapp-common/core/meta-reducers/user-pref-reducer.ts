import {ActionReducer, Action} from '@ngrx/store';
import {merge, pick} from 'lodash-es';
import {setPreferences} from '../actions/users.actions';
import {UserPreferences} from '@common/user-preferences';

interface ExtAction extends Action {
  noPreferences?: boolean;
}

const firstRun = {};

export const createUserPrefReducer = (
  key: string,
  syncedKeys: string[],
  actionsPrefix: string[],
  userPreferences: UserPreferences,
  reducer: ActionReducer<any>
): ActionReducer<any, ExtAction> => {

  if (firstRun[key] === undefined) {
    firstRun[key] = true;
  }
  let timeout: number;

  return (state, action): any => {
    let nextState = reducer(state, action);

    if (firstRun[key] && userPreferences.isReady() && nextState[key]) {
      firstRun[key]         = false;
      let savedState = userPreferences.getPreferences(key);
      savedState = Object.entries(savedState || {}).reduce(( acc, [param, val]) => {
        if (val!== undefined && !nextState[param]) {
          acc[param] = val;
        }
        return acc;
      }, {});
      return merge({}, nextState, {[key]: {...savedState, preferencesReady: true}});
    }
    if (action.type === setPreferences.type) {
      const savedState = (action as ReturnType<typeof setPreferences>).payload[key];
      nextState = merge({}, nextState, savedState);
    }

    // filter unchanged state.
    if (action.noPreferences || state === nextState || !(nextState?.[key]?.preferencesReady)) {
      return nextState;
    }

    if (actionsPrefix &&
      !actionsPrefix.some(ap => action.type.startsWith(ap))) {
      return nextState;
    }

    const val = pick(nextState[key], syncedKeys );
    clearTimeout(timeout);
    timeout = window.setTimeout(() => userPreferences.setPreferences(key, val), 2000);
    return nextState;
  };
};

export const createUserPrefFeatureReducer = (
  key: string,
  syncedKeys: string[],
  actionsPrefix: string[],
  userPreferences: UserPreferences,
  reducer: ActionReducer<any>,
): ActionReducer<any, ExtAction> => {

  if (firstRun[key] === undefined) {
    firstRun[key] = true;
  }
  let timeout: number;

  return (state, action): any => {
    let nextState = reducer(state, action);

    if (firstRun[key] && userPreferences.isReady() && nextState) {
      firstRun[key]         = false;
      const savedState = userPreferences.getPreferences(key);
      return merge({}, nextState, savedState);
    }
    if (action.type === setPreferences.type) {
      const savedState = (action as ReturnType<typeof setPreferences>).payload[key];
      nextState = merge({}, nextState, savedState);
    }

    // filter unchanged state.
    if (action.noPreferences || state === nextState) {
      return nextState;
    }

    if (actionsPrefix &&
      !actionsPrefix.some(ap => action.type.startsWith(ap))) {
      return nextState;
    }

    if (syncedKeys.length > 0) {
      const val = pick(nextState, syncedKeys);
      clearTimeout(timeout);
      timeout = window.setTimeout(() => userPreferences.setPreferences(key, val), 2000);
    }
    return nextState;
  };
};
