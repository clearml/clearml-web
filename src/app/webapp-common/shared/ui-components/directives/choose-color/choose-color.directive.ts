import {Directive, ElementRef, HostListener, Input} from '@angular/core';
import {colorToString, hexToRgb} from '@common/shared/services/color-hash/color-hash.utils';
import {Store} from '@ngrx/store';
import {showColorPicker} from './choose-color.actions';
import {colorPickerHeight, colorPickerWidth} from '@common/shared/ui-components/directives/choose-color/choose-color.reducer';

@Directive({
    selector: '[smChooseColor]',
    standalone: false
})
export class ChooseColorDirective {
  readonly colorTopOffset    = 100;
  readonly colorPickerWidth  = colorPickerWidth;
  readonly colorPickerHeight = colorPickerHeight - this.colorTopOffset;
  @Input() colorButtonRef;
  @Input() colorButtonClass: string;
  @Input() stringToColor: string | string[];
  @Input() colorPickerWithAlpha: boolean = false;
  private _defaultColor: number[];
  private defaultColorString: string;

  @Input() set smChooseColor(defaultColor: number[] | string) {
    if(typeof defaultColor === 'string') {
      this._defaultColor = hexToRgb(defaultColor);
    } else {
      this._defaultColor = defaultColor;
    }
    this.defaultColorString = colorToString(defaultColor);
  }

  get defaultColor() {
    return this._defaultColor;
  }

  @HostListener('mousedown', ['$event'])
  public onMouseDown(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
  }

  @HostListener('click', ['$event'])
  public onClick(event: MouseEvent): void {
    const elementsWithClass = this.colorButtonClass ? Array.from(this.el.nativeElement.querySelectorAll(this.colorButtonClass)) : [];
    const matchingEl        = elementsWithClass.find(el => el === event.target);
    const matchingRef       = this.colorButtonRef?.nativeElement ? this.colorButtonRef.nativeElement : this.colorButtonRef;

    if (matchingEl || matchingRef === event.target) {
      event.stopPropagation();
      this.openColorPicker(event);
    }
  }

  constructor(private el: ElementRef, private store: Store) {}

  openColorPicker(event: MouseEvent) {
    let top = Math.max(event.pageY - (this.colorPickerHeight / 3), 30);
    let left = event.pageX;
    if (event.pageY + this.colorPickerHeight >= (window.innerHeight || document.documentElement.clientHeight)) {
      top = Math.max((event.pageY) - colorPickerHeight, 15);
    }
    if (event.clientX + this.colorPickerWidth >= (window.innerWidth || document.documentElement.clientWidth)) {
      left = Math.max((event.clientX) - colorPickerWidth, 15);
    }

    this.store.dispatch(showColorPicker({
      top,
      left,
      theme: 'light',
      defaultColor: this.defaultColorString,
      cacheKey: Array.isArray(this.stringToColor) ? structuredClone(this.stringToColor).sort().join() : this.stringToColor,
      alpha: this.colorPickerWithAlpha
    }));
    event.stopPropagation();
  }

}

