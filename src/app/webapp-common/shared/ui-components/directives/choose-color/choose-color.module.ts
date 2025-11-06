import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ColorPickerWrapperComponent} from '../../inputs/color-picker/color-picker-wrapper.component';
import {ColorPickerDirective} from 'ngx-color-picker';
import {StoreModule} from '@ngrx/store';
import {colorPreferenceReducer} from './choose-color.reducer';
import {MatButton} from '@angular/material/button';



export const colorSyncedKeys    = [
  'colorPreferences',
];

@NgModule({
  declarations: [ColorPickerWrapperComponent],
  imports: [
    CommonModule,
    StoreModule.forFeature('colorsPreference', colorPreferenceReducer),
    MatButton,
    ColorPickerDirective,
  ],
  exports: [ColorPickerWrapperComponent],
})
export class ChooseColorModule {
}
