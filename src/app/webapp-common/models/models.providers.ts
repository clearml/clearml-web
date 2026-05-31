import {InjectionToken} from '@angular/core';
import {ActionReducer, provideState, StoreConfig} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {ModelsState, reducers} from './reducers';
import {ModelsViewEffects} from './effects/models-view.effects';
import {ModelsInfoEffects} from './effects/models-info.effects';
import {ModelsMenuEffects} from './effects/models-menu.effects';
import {MODELS_PREFIX_VIEW, MODELS_STORE_KEY} from './models.consts';
import {merge, pick} from 'lodash-es';

export const MODELS_CONFIG_TOKEN =
  new InjectionToken<StoreConfig<ModelsState>>('ModelsConfigToken');

const localStorageKey = '_saved_models_state_';

const getInitState = () => ({
  metaReducers: [
    (reducer: ActionReducer<ModelsState>) => {
      let onInit = true;
      return (state: ModelsState, action: any) => {
        const nextState = reducer(state, action);
        if (onInit) {
          onInit = false;
          const savedState = JSON.parse(localStorage.getItem(localStorageKey));
          return merge({}, nextState, savedState);
        }
        if (action.type.startsWith(MODELS_PREFIX_VIEW)) {
          localStorage.setItem(localStorageKey, JSON.stringify(pick(nextState, ['view.tableMode'])));
        }
        return nextState;
      };
    },
  ]
});

export const modelsProviders = [
  provideState(MODELS_STORE_KEY, reducers, MODELS_CONFIG_TOKEN),
  provideEffects([ModelsInfoEffects, ModelsMenuEffects, ModelsViewEffects]),
  {provide: MODELS_CONFIG_TOKEN, useFactory: getInitState},
];
