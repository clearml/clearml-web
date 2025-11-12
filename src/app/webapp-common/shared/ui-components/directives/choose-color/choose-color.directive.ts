import {computed, Directive, ElementRef, input, inject } from '@angular/core';
import {colorToString, hexToRgb} from '@common/shared/services/color-hash/color-hash.utils';
import {Store} from '@ngrx/store';
import {showColorPicker} from './choose-color.actions';
import {colorPickerHeight, colorPickerWidth} from '@common/shared/ui-components/directives/choose-color/choose-color.reducer';

@Directive({
  selector: '[smChooseColor]',
  host: {
    '(mousedown)': 'onMouseDown($event)',
    '(click)': 'onClick($event)'
  }
})
export class ChooseColorDirective {
  private readonly el = inject(ElementRef);
  private readonly store = inject(Store);

  readonly colorTopOffset    = 100;
  readonly colorPickerWidth  = colorPickerWidth;
  readonly colorPickerHeight = colorPickerHeight - this.colorTopOffset;

  colorButtonRef = input<ElementRef<ElementRef> | HTMLElement>();
  colorButtonClass = input<string>();
  stringToColor = input<string | string[]>();
  colorPickerWithAlpha = input(false);
  smChooseColor= input();
  defaultColor = computed(() => {
    if(typeof this.smChooseColor() === 'string') {
      return  hexToRgb(this.smChooseColor());
    } else {
      return this.smChooseColor();
    }
  });

  private defaultColorString = computed(() => colorToString(this.defaultColor()));


  public onMouseDown(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
  }

  public onClick(event: MouseEvent): void {
    const elementsWithClass = this.colorButtonClass() ? Array.from(this.el.nativeElement.querySelectorAll(this.colorButtonClass()!)): [];
    const matchingEl  = elementsWithClass.find(el => el === event.target);
    const matchingRef = this.colorButtonRef()['nativeElement'] ?? this.colorButtonRef();

    if (matchingEl || matchingRef === event.target) {
      event.stopPropagation();
      this.openColorPicker(event);
    }
  }

  openColorPicker(event: MouseEvent) {
    let top = Math.max(event.pageY - (this.colorPickerHeight / 3), 30);
    let left = event.pageX;
    if (event.pageY + this.colorPickerHeight >= (window.innerHeight || document.documentElement.clientHeight)) {
      top = Math.max((event.pageY) - colorPickerHeight, 15);
    }
    if (event.clientX + this.colorPickerWidth >= (window.innerWidth || document.documentElement.clientWidth)) {
      left = Math.max((event.clientX) - colorPickerWidth, 15);
    }
    let cacheKey = this.stringToColor();
    if (Array.isArray(cacheKey)) {
      cacheKey = cacheKey.toSorted().join();
    }

    this.store.dispatch(showColorPicker({
      top,
      left,
      theme: 'light',
      defaultColor: this.defaultColorString(),
      cacheKey,
      alpha: this.colorPickerWithAlpha()
    }));
    event.stopPropagation();
  }
}

