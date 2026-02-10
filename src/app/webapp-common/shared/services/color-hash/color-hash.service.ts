import {inject, Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {BehaviorSubject, combineLatest, filter, take, map, distinctUntilChanged} from 'rxjs';
import {
  selectColorPickerProps,
  selectColorPreferences
} from '../../ui-components/directives/choose-color/choose-color.reducer';
import {
  addUpdateColorPreferences,
  ColorPreference
} from '../../ui-components/directives/choose-color/choose-color.actions';
import stc from 'string-to-color';
import {TinyColor} from '@ctrl/tinycolor';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {isEqual} from 'lodash-es';
import {debounceTime, startWith} from 'rxjs/operators';

export type ColorCache = Record<string, number[]>;

export const DOT_PLACEHOLDER = '--DOT--';


@Injectable()
export class ColorHashService {
  private store = inject(Store);

  private _colorCache = new BehaviorSubject<ColorCache>({});
  private _tempColor = new BehaviorSubject<ColorCache>(null);
  __signal = toSignal(this.getColorCache());

  getColorCache() {
    return combineLatest([
      this._colorCache.asObservable(),
      this._tempColor.asObservable().pipe( distinctUntilChanged(isEqual))
    ])
      .pipe(
        debounceTime(50),
        startWith([]),
        map(([cache, tmp]) => ({...cache, ...tmp} as ColorCache)),
      );
  }

  setColorCache(obj: ColorCache) {
    this._colorCache.next(obj);
  }

  constructor() {
    this.store.select(selectColorPreferences)
      .pipe(
        filter(preferenceColors => !!preferenceColors),
        take(1)
      )
      .subscribe(preferenceColors => {
        // alpha one if is a migration script that can be removed after a while... (11/12/2024)
        const alphaOne = Object.keys(preferenceColors).some(key => preferenceColors[key][3] === 1);
        if (alphaOne) {
          const migratedPreferenceColors = {};
          Object.keys(preferenceColors).forEach(key => {
            migratedPreferenceColors[key] = [...preferenceColors[key]];
            if (preferenceColors[key][3] === 1) {
              migratedPreferenceColors[key][3] = 0.35;
            }
          });
          this.store.dispatch(addUpdateColorPreferences(migratedPreferenceColors));
          this.batchUpdateColorCache(migratedPreferenceColors);
        } else {
          this.batchUpdateColorCache(preferenceColors);
        }
      });

    this.store.select(selectColorPickerProps)
      .pipe(
        takeUntilDestroyed(),
        filter(props => props === null),
      )
      .subscribe(() => this._tempColor.next(null));
  }

  public initColor(label: string, initColor?: number[], lighten = false): number[] {
    if (label === undefined) {
      return [255, 255, 255];
    }
    const colorCache = this.colorsSignal()?.[label];
    if (colorCache) {
      return colorCache;
    }
    let tColor = new TinyColor(stc(label));
    const tLum = tColor.getLuminance();
    if (tLum < 0.3 && lighten) {
      tColor = tColor.lighten(30 - tLum * 100);
    }
    if (tColor.getBrightness() > 210 && !lighten) {
      tColor = tColor.shade(12);
    }
    const {r, g, b} = tColor.toRgb();
    const color = initColor ? initColor : [r, g, b];
    this.setColorForString(label, color, false);
    return color;
  }

  public hasColor(label: string): boolean {
    return !!this._colorCache.getValue()[label];
  }

  public getColorsObservable() {
    return this.getColorCache();
  }

  get colorsSignal() {
    return this.__signal;
  }

  private batchUpdateColorCache(colors: ColorPreference) {
    const newColorCache = {...this._colorCache.getValue(), ...colors};
    const filteredCache = {};
    Object.keys(newColorCache).forEach(color => {
      const regex = new RegExp(DOT_PLACEHOLDER, 'g');
      const cleanKey = color.replace(regex, '.');
      filteredCache[cleanKey] = newColorCache[color];
    });
    this.setColorCache(filteredCache);
  }

  setTempColorForString(key: string, color: number[], saveAlpha = false) {
    color = saveAlpha ?
      color :
      [color[0], color[1], color[2], this._colorCache.getValue()[key] ? this._colorCache.getValue()[key][3] : 0.35];
    this._tempColor.next({[key]: color});
  }

  setColorForString(key: string, color: number[], savePreference = true, saveAlpha = false) {
    if (savePreference) {
      color = saveAlpha ? color : [color[0], color[1], color[2], this._colorCache.getValue()[key] ? this._colorCache.getValue()[key][3] : 0.35];
      this.setColorCache({
        ...this._colorCache.getValue(),
        [key]: color
      });
      this.store.dispatch(addUpdateColorPreferences({[key]: color}));
    }
  }

  public hex(hash: string) {
    const rgb = this.initColor(hash);
    return new TinyColor({r: rgb[0], g: rgb[1], b: rgb[2], a: rgb[3]}).toHexString();
  }

  public getRgbString(strings: string[], opacity = 0.35) {
    const color = this.mixColors(strings, opacity);
    if (opacity !== -1) {
      return `rgba(${color[0]},${color[1]},${color[2]},${opacity})`;
    } else {
      return `rgb(${color[0]},${color[1]},${color[2]})`;
    }
  }

  public mixColors(colors: string[], forcedOpacity: number = null): number[] {
    const firstColor = this.initColor(colors[0]);
    let tc = new TinyColor({r: firstColor[0], g: firstColor[1], b: firstColor[2]});
    if (colors.length > 1) {
      tc = tc.mix({r: 0, g: 0, b: 0}, 100 / colors.length);
    }
    colors.slice(1).forEach(colorString => {
      const color = this.initColor(colorString);
      tc = tc.mix({r: color[0], g: color[1], b: color[2]}, 100 / colors.length);
    });
    return [Math.floor(tc.r), Math.floor(tc.g), Math.floor(tc.b), forcedOpacity ?? tc.a];
  }

  saveTempColor() {
    this.setColorCache({
      ...this._colorCache.getValue(),
      ...this._tempColor.getValue()
    });
    this.store.dispatch(addUpdateColorPreferences(this._tempColor.getValue()));
  }
}

