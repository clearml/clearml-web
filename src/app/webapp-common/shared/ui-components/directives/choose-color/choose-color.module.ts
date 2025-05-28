import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChooseColorDirective} from './choose-color.directive';
import {ColorPickerWrapperComponent} from '../../inputs/color-picker/color-picker-wrapper.component';
import {ColorPickerDirective} from 'ngx-color-picker';
import {StoreModule} from '@ngrx/store';
import {colorPreferenceReducer} from './choose-color.reducer';
import {MatButton} from '@angular/material/button';



export const colorSyncedKeys    = [
  'colorPreferences',
];

const _declarations = [
  ChooseColorDirective,
  ColorPickerWrapperComponent
];

@NgModule({
  providers      : [
    ChooseColorDirective,
  ],
  declarations   : _declarations,
  imports: [
    CommonModule,
    StoreModule.forFeature('colorsPreference', colorPreferenceReducer),
    MatButton,
    ColorPickerDirective,
  ],
  exports        : _declarations
})
export class ChooseColorModule {
}
