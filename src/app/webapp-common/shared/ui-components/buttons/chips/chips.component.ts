import {ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, model, output} from '@angular/core';
import {ColorHashService} from '../../../services/color-hash/color-hash.service';
import {FORCED_COLORS_FOR_STRING} from '../../../services/color-hash/color-hash-constants';
import {getCssTheme} from '../../../utils/shared-utils';
import {invertRgb} from '../../../services/color-hash/color-hash.utils';
import {mostReadable, TinyColor} from '@ctrl/tinycolor';

import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {ChooseColorDirective} from '@common/shared/ui-components/directives/choose-color/choose-color.directive';

@Component({
  selector: 'sm-chips',
  templateUrl: './chips.component.html',
  styleUrls: ['./chips.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TooltipDirective,
    ShowTooltipIfEllipsisDirective,
    MatIconButton,
    MatIcon,
    ChooseColorDirective
  ]
})
export class ChipsComponent {
  readonly #elRef = inject(ElementRef);
  readonly #colorHash = inject(ColorHashService);

  label = input<string>();
  // Default options are defined in getColorScheme
  isDarkBackground = model(true);
  maxWidth = input('100%');
  allowRemove = input(false);
  remove = output<MouseEvent>();

  protected forcedColor = computed(() => FORCED_COLORS_FOR_STRING[this.label()]);
  private labelColor = computed(() => {
    const forcedColor = this.forcedColor();
    if (forcedColor) {
      return this.isDarkBackground() ? invertRgb(forcedColor) : forcedColor;
    }
    return this.#colorHash.initColor(this.label());
  });

  protected color = computed(() => {
    const color = this.labelColor();
    return `rgb(${color[0]},${color[1]},${color[2]})`;
  });

  protected backgroundColor = computed(() => {
    if (!this.labelColor()) {
      return null;
    }
    const t = new TinyColor(this.color());
    return mostReadable(t.toString(), t.isDark() ?
      [t.lighten(35).toString(), t.lighten(25).toString(), t.lighten(15).toString()] :
      [t.darken(35).toString(), t.darken(25).toString(), t.darken(15).toString()], {
      includeFallbackColors: false,
      level: 'AA'
    }).toRgbString();
  });

  protected textColor = computed(() => {
    if (!this.backgroundColor()) {
      return null;
    }
    const background = new TinyColor(this.backgroundColor());
    return mostReadable(background.toString(), background.isDark() ?
      [background.lighten(70).toString(), background.lighten(50).toString(), background.lighten(30).toString()] :
      [background.darken(70).toString(), background.darken(50).toString(), background.darken(30).toString()], {
      includeFallbackColors: false,
      level: 'AA'
    }).toRgbString();
  });
  constructor() {
    this.isDarkBackground.set(getCssTheme(this.#elRef.nativeElement) == 'dark-theme');
  }

  offsetWidth() {
    return this.#elRef.nativeElement.offsetWidth;
  }
}

