import {ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import {ISmCol, TABLE_SORT_ORDER} from '../../ui-components/data/table/table.consts';
import {MenuItemComponent} from '@common/shared/ui-components/panel/menu-item/menu-item.component';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

@Component({
    selector: 'sm-custom-columns-list',
    templateUrl: './custom-columns-list.component.html',
    styleUrls: ['./custom-columns-list.component.scss'],
    imports: [
        MenuItemComponent,
        MatProgressSpinnerModule,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomColumnsListComponent {
  tableCols = input<ISmCol[]>();
  selectable = input<boolean>(true);
  removeColFromList = output<ISmCol['id']>();
  selectedTableColsChanged = output<ISmCol>();

  protected readonly TABLE_SORT_ORDER = TABLE_SORT_ORDER;
}
