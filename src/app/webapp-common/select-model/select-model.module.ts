import {NgModule} from '@angular/core';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {selectModelReducer} from './select-model.reducer';
import {SelectModelEffects} from './select-model.effects';

@NgModule({
  imports: [
    EffectsModule.forFeature([SelectModelEffects]),
    StoreModule.forFeature('selectModel', selectModelReducer),
  ],
})
export class SelectModelModule {
}
