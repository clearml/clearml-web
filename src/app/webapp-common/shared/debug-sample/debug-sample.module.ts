import {NgModule} from '@angular/core';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {debugSampleReducer} from '@common/shared/debug-sample/debug-sample.reducer';
import {DebugSampleEffects} from '@common/shared/debug-sample/debug-sample.effects';


@NgModule({
  imports: [
    StoreModule.forFeature('debugSample', debugSampleReducer),
    EffectsModule.forFeature([DebugSampleEffects]),
  ]
})
export class DebugSampleModule {
}
