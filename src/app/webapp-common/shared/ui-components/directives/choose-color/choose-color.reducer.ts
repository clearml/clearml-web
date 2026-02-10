import {Action, createReducer, createSelector, on} from '@ngrx/store';
import {
  addUpdateColorPreferences,
  closeColorPicker,
  ColorPickerProps,
  ColorPreference,
  showColorPicker
} from './choose-color.actions';

export const colorPickerHeight = 405;
export const colorPickerWidth = 260;

export interface ColorPreferenceState {
  colorPreferences: ColorPreference;
  pickerProps: ColorPickerProps;
}

export const initialState: ColorPreferenceState = {
  colorPreferences: null,
  pickerProps: null
};

export const colors = state => state.colorsPreference as ColorPreferenceState;
export const selectColorPreferences = createSelector(colors, state => state.colorPreferences);
export const selectColorPickerProps = createSelector(colors, state => state.pickerProps);

const reducer = createReducer(
  initialState,
  on(addUpdateColorPreferences, (state, action): ColorPreferenceState =>
    ({...state, colorPreferences: {...state.colorPreferences, ...action}})),
  on(showColorPicker, (state , action): ColorPreferenceState =>
    ({...state, pickerProps: action})),
  on(closeColorPicker, (state): ColorPreferenceState => ({...state, pickerProps: null}))
);

export const colorPreferenceReducer = (state: ColorPreferenceState | undefined, action: Action) => reducer(state, action);
