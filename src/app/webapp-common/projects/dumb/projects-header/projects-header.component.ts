import {Component, input, output, computed} from '@angular/core';
import {TableSortOrderEnum} from '@common/shared/ui-components/data/table/table.consts';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';
import {MenuItemComponent} from '@common/shared/ui-components/panel/menu-item/menu-item.component';
import {ShowOnlyUserWorkComponent} from '@common/shared/components/show-only-user-work/show-only-user-work.component';
import {MainPagesHeaderFilterComponent} from '@common/shared/components/main-pages-header-filter/main-pages-header-filter.component';
import {CommonSearchComponent} from '@common/common-search/containers/common-search/common-search.component';

@Component({
  selector: 'sm-projects-header',
  templateUrl: './projects-header.component.html',
  styleUrls: ['./projects-header.component.scss'],
  imports: [
    MenuComponent,
    MenuItemComponent,
    ShowOnlyUserWorkComponent,
    MainPagesHeaderFilterComponent,
    CommonSearchComponent,
  ]
})
export class ProjectsHeaderComponent {
  searchQuery = input<string>();
  sortOrder = input<TableSortOrderEnum>();
  tags = input<string[]>();
  enableTagsFilter = input(true);
  sortByField = input<string>();

  sortByTitle = computed(() => this.sortByField().includes('name') ? 'NAME' : 'RECENT');

  orderByChanged = output<string>();
  searchChanged = output<string>();
}


