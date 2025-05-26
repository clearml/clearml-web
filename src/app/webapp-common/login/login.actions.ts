import {createAction, props} from '@ngrx/store';


export const getTOU = createAction('[login] get TOU');

export const setTOU = createAction(
  '[login] set TOU',
  props<{terms: string}>()
);
