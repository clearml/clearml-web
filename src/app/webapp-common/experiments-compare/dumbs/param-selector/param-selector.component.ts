import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';
import {ExperimentSharedModule} from '~/features/experiments/shared/experiment-shared.module';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {
  GroupedCheckedFilterListComponent
} from '@common/shared/ui-components/data/grouped-checked-filter-list/grouped-checked-filter-list.component';
import { trackByIndex } from '@common/shared/utils/forms-track-by';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';

@Component({
  selector: 'sm-param-selector',
  templateUrl: './param-selector.component.html',
  styleUrl: './param-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MenuComponent,
    ExperimentSharedModule,
    ClickStopPropagationDirective,
    GroupedCheckedFilterListComponent,
    TooltipDirective,
    ShowTooltipIfEllipsisDirective
  ],
})
export class ParamSelectorComponent {
  public trackByIndex = trackByIndex;

  selectedHyperParams = input<string[]>();
  title = input<string>();
  itemsList = input<Record<string, any>>();
  single = input<boolean>();
  selectFilteredItems = input<boolean>();
  selectedItemsListMapper = input<(data) => string>();
  selectedItems = output<{ param: string }>();
  clearSelection = output();

  removeHyperParam(param: string) {
    this.selectedItems.emit({param})
  }
}
