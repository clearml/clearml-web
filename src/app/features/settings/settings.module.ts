import { NgModule } from '@angular/core';
import { SettingsRoutingModule } from './settings-routing.module';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {SettingsEffects} from '~/features/settings/settings.effects';
import {settingsFeatureKey, settingsReducers} from '~/features/settings/settings.reducer';



@NgModule({
  imports: [
    SettingsRoutingModule,
    StoreModule.forFeature(settingsFeatureKey, settingsReducers),
    EffectsModule.forFeature([SettingsEffects]),
  ],
})
export class SettingsModule { }
