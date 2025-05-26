import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Renderer2, input, output, viewChild, effect, model, inject
} from '@angular/core';
import {MatMenuModule, MatMenuTrigger} from '@angular/material/menu';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatInputModule} from '@angular/material/input';
import {FormsModule} from '@angular/forms';
import {MatListModule} from '@angular/material/list';

import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatIconButton} from '@angular/material/button';

@Component({
    selector: 'sm-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatMenuModule,
        TooltipDirective,
        MatInputModule,
        FormsModule,
        MatListModule,
        ClickStopPropagationDirective,
        ShowTooltipIfEllipsisDirective,
        MatIcon,
        MatIconButton,
        MatButton
    ]
})
export class MenuComponent {
  private renderer = inject(Renderer2);
  private elRef = inject(ElementRef);
  protected eRef = inject(ElementRef);

  searchPlaceholder = input<string>('');
  header = input<string>();
  buttonClass = input<string>();
  smMenuClass = input<string>();
  panelClasses = input<string>();
  iconClass = input<string>('al-ico-dropdown-arrow');
  showCart = input<boolean>(true);
  openOnInit = input<boolean>(false);
  showOverlay = input<boolean>(true);
  enableSearch = input<boolean>(false);
  searchValue = model<string>();
  fixedOptionsSubheader = input<string>();
  buttonTooltip = input<string>();
  prefixIconClass = input<string>();
  disabled = input<boolean>();
  position = input<{ x: number; y: number }>();
  menuClosed = output();
  menuOpened = output();
  searchValueChanged = output<string>();
  trigger = viewChild(MatMenuTrigger);

  @HostListener('document:click', ['$event'])
  clickOut(event: MouseEvent) {
    if (this.trigger()?.menuOpen && !this.showOverlay() && !this.eRef.nativeElement.contains(event.target)) {
      this.trigger().closeMenu();
    }
  }

  constructor() {
    effect(() => {
      if (this.position()) {
        this.movePosition(this.position());
      }
    });

    effect(() => {
      if (this.openOnInit() && this.trigger()) {
        window.setTimeout(() => this.openMenu(), 50);
      }
    });
  }

  public openMenu() {
    this.trigger().openMenu();
  }

  movePosition(position) {
    if (!this.elRef.nativeElement || !position) {
      return;
    }
    this.renderer.setStyle(this.elRef.nativeElement, 'position', 'fixed');
    this.renderer.setStyle(this.elRef.nativeElement, 'left', position.x + 'px');
    this.renderer.setStyle(this.elRef.nativeElement, 'top', position.y + 'px');
  }

  clearSearch() {
    this.searchValue.set('');
    this.searchValueChanged.emit('');
  }
}
