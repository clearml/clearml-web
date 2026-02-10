import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {TableSortOrderEnum} from '@common/shared/ui-components/data/table/table.consts';
import {MenuItemComponent} from '@common/shared/ui-components/panel/menu-item/menu-item.component';
import {
  MainPagesHeaderFilterComponent
} from '@common/shared/components/main-pages-header-filter/main-pages-header-filter.component';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';
import {ToggleArchiveComponent} from '@common/shared/ui-components/buttons/toggle-archive/toggle-archive.component';
import {CommonSearchComponent} from '@common/common-search/containers/common-search/common-search.component';
import {FormsModule} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {ButtonToggleComponent} from '@common/shared/ui-components/inputs/button-toggle/button-toggle.component';

@Component({
  selector: 'sm-reports-header',
  templateUrl: './reports-header.component.html',
  styleUrls: ['./reports-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MenuItemComponent,
    MainPagesHeaderFilterComponent,
    MenuComponent,
    ToggleArchiveComponent,
    CommonSearchComponent,
    MatIconModule,
    FormsModule,
    MatButton,
    ButtonToggleComponent
  ]
})
export class ReportsHeaderComponent {

  archive = input<boolean>();
  disableCreate = input(false);
  disableSort = input(false);
  sortOrder = input<TableSortOrderEnum>();
  allTags = input<string[]>([]);
  projectId = input<string>();
  sortByField = input<string>();

  sortByTitle = computed(() => this.sortByField().includes('name') ? 'NAME' : 'RECENT')

  reportsFilterChanged = output<string>();
  orderByChanged = output<string>();
  createReportClicked = output<string>();
  archiveToggled = output<boolean>();
  toggleNestedView = output<boolean>();
}
