import {commonAuthReducer, initAuth, selectAuth} from '@common/core/reducers/common-auth-reducer';
import {createReducer, createSelector} from '@ngrx/store';

const extraCredentials = [];
const services = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const selectExtraCredentials = createSelector(selectAuth, state => extraCredentials);
export const selectCompanyPreSignServices = createSelector(selectAuth, state => services);

export const authReducer = createReducer(
  initAuth,
  ...commonAuthReducer
);
