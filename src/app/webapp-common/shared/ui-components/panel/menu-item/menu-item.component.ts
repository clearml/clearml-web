import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {TABLE_SORT_ORDER} from '../../data/table/table.consts';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatMenuModule} from '@angular/material/menu';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {MatIconModule} from '@angular/material/icon';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatIconButton} from '@angular/material/button';

@Component({
  selector: 'sm-menu-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TooltipDirective,
    MatMenuModule,
    ShowTooltipIfEllipsisDirective,
    MatIconModule,
    ClickStopPropagationDirective,
    MatCheckboxModule,
    MatIconButton
  ]
})
export class MenuItemComponent {
  removable = input(false);
  disabled = input(false);
  itemLabel = input<string>();
  itemValue = input<string>();
  itemTooltip = input<string>();
  iconClass = input('');
  enableIcon = input(true);
  selectable = input(false);
  checked = input(false);
  sortOrder = input<number>();
  enableTooltip = input<boolean>();
  itemClicked = output<{
        event?: MouseEvent;
        itemValue: string;
    }>();
  removeItemClicked = output<string>();
  closeMenu = output();

  public TABLE_SORT_ORDER = TABLE_SORT_ORDER;

  itemClickedEvent(event?: MouseEvent) {
    if (!this.disabled()) {
      this.itemClicked.emit({event, itemValue: this.itemValue()});
    }
  }

  buttonClickedEvent(event: MouseEvent) {
    this.itemClickedEvent(event);
    if (this.selectable()) {
      event.stopPropagation();
    }
  }

  removeItem(event: MouseEvent) {
    this.removeItemClicked.emit(this.itemValue());
    event.stopPropagation();
  }
}
