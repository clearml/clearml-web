import {
  ChangeDetectionStrategy,
  Component, computed,
  effect,
  inject,
  signal,
  viewChild
} from '@angular/core';
import {Store} from '@ngrx/store';
import {colorPickerHeight, colorPickerWidth, selectColorPickerProps} from '@common/shared/ui-components/directives/choose-color/choose-color.reducer';
import {ColorHashService} from '@common/shared/services/color-hash/color-hash.service';
import {TinyColor} from '@ctrl/tinycolor';
import {ColorPickerDirective} from 'ngx-color-picker';
import {closeColorPicker} from '@common/shared/ui-components/directives/choose-color/choose-color.actions';

export const presetColors = [
  '#1f77b4',  // muted blue
  '#ff7f0e',  // safety orange
  '#2ca02c',  // cooked asparagus green
  '#d62728',  // brick red
  '#9467bd',  // muted purple
  '#8c564b',  // chestnut brown
  '#e377c2',  // raspberry yogurt pink
  '#7f7f7f',  // middle gray
  '#bcbd22',  // curry yellow-green
  '#17becf',   // blue-teal
  '#af1d41',
  '#d5d728'
];

export const presetColorsDark = [
  '#21a2da',  // muted blue
  '#ff7f0e',  // safety orange
  '#2ca02c',  // cooked asparagus green
  '#e65c5c',  // brick red
  '#9467bd',  // muted purple
  '#edd913',  // curry yellow-green
  '#cc796e',  // chestnut brown
  '#e377c2',  // raspberry yogurt pink
  '#7f7f7f',  // middle gray
  '#17becf',   // blue-teal
  '#f44778',
  '#cbcd24'
];

@Component({
    selector: 'sm-color-picker-wrapper',
    templateUrl: './color-picker-wrapper.component.html',
    styleUrls: ['./color-picker-wrapper.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ColorPickerWrapperComponent {
  private store = inject(Store);
  private colorHashService = inject(ColorHashService);

  protected readonly presetColors = presetColors;
  protected readonly alphaPresetColors = [...presetColors, 'rgba(0,0,0,0)'];

  protected picker = viewChild(ColorPickerDirective);
  public props = this.store.selectSignal(selectColorPickerProps);
  protected state = computed(() => ({
    props: {
      ...this.props(),
      left: this.props()?.left + colorPickerWidth >= (window.innerWidth || document.documentElement.clientWidth) ?
        Math.max(this.props()?.left - colorPickerWidth, 15) : this.props()?.left,
      top: this.props()?.top + colorPickerHeight >= (window.innerHeight || document.documentElement.clientHeight) ?
        Math.max(this.props()?.top - colorPickerHeight, 15) : this.props()?.top,
    },
    picker: this.picker(),
    color: signal(this.props()?.defaultColor)
  }));

  constructor() {
    effect(() => {
      if (this.props() && this.picker()) {
        this.picker().openDialog();
      }
    });
  }

  closeColorPicker() {
    this.store.dispatch(closeColorPicker());
    this.picker().closeDialog();
  }

  selectColor() {
    const {r, g, b, a} = new TinyColor(this.state().color()).toRgb();
    const color = [r, g, b, (this.state().props.alpha && a === 1) ? 0.99999 : a];
    this.colorHashService.setColorForString(this.props().cacheKey, color, true, this.state().props.alpha);
    this.closeColorPicker();
  }
}
