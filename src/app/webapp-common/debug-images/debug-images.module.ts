import {NgModule} from '@angular/core';
import {EffectsModule} from '@ngrx/effects';
import {StoreModule} from '@ngrx/store';
import {DebugImagesEffects} from './debug-images-effects';
import {debugSamplesReducer} from './debug-images-reducer';
import {DebugSampleModule} from '@common/shared/debug-sample/debug-sample.module';


@NgModule({
  imports: [
    StoreModule.forFeature('debugImages', debugSamplesReducer),
    EffectsModule.forFeature([DebugImagesEffects]),
    DebugSampleModule,
  ]
})
export class DebugImagesModule {
}
