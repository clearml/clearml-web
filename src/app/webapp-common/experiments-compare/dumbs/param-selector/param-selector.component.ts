import {Component, EventEmitter, Input, Output} from '@angular/core';
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
    imports: [
        MenuComponent,
        ExperimentSharedModule,
        ClickStopPropagationDirective,
        GroupedCheckedFilterListComponent,
        TooltipDirective,
        ShowTooltipIfEllipsisDirective
    ],
    templateUrl: './param-selector.component.html',
    styleUrl: './param-selector.component.scss'
})
export class ParamSelectorComponent {
  public trackByIndex = trackByIndex;

  @Input() selectedHyperParams: string[];
  @Input() title: string;
  @Input() itemsList: Record<string, any>;
  @Input() single: boolean;
  @Input() selectFilteredItems: boolean;

  @Input() selectedItemsListMapper: (data) => string;
  @Output() selectedItems = new EventEmitter<{ param: string }>();
  @Output() clearSelection = new EventEmitter();

  removeHyperParam(hyperParam: string) {
    this.selectedItems.emit({param:hyperParam})
  }
}
