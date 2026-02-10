import {InjectionToken, NgModule} from '@angular/core';
import {ModelRouterModule} from './models-routing.module';
import {EffectsModule} from '@ngrx/effects';
import {StoreConfig, StoreModule} from '@ngrx/store';
import {ModelsState, reducers} from './reducers';
import {ModelsViewEffects} from './effects/models-view.effects';
import {ModelsInfoEffects} from './effects/models-info.effects';
import {ExperimentSharedModule} from '~/features/experiments/shared/experiment-shared.module';
import {ModelsMenuEffects} from './effects/models-menu.effects';
import {MODELS_PREFIX_VIEW, MODELS_STORE_KEY} from './models.consts';
import {merge, pick} from 'lodash-es';


export const MODELS_CONFIG_TOKEN =
  new InjectionToken<StoreConfig<ModelsState>>('ModelsConfigToken');

const localStorageKey = '_saved_models_state_';

const getInitState = () => ({
  metaReducers: [
    reducer => {
      let onInit = true;
      return (state, action) => {
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


@NgModule({
  imports: [
    StoreModule.forFeature(MODELS_STORE_KEY, reducers, MODELS_CONFIG_TOKEN),
    EffectsModule.forFeature([ModelsViewEffects, ModelsInfoEffects, ModelsMenuEffects]),
    ModelRouterModule,
    ExperimentSharedModule,
  ],
  providers: [
    {provide: MODELS_CONFIG_TOKEN, useFactory: getInitState},
  ],
})
export class ModelsModule {
}
