import {provideState} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {SettingsEffects} from '~/features/settings/settings.effects';
import {settingsFeatureKey, settingsReducers} from '~/features/settings/settings.reducer';

export const settingsProviders = [
  provideState(settingsFeatureKey, settingsReducers),
  provideEffects([SettingsEffects])
];
