import {Component, input, output, computed} from '@angular/core';
import {TableSortOrderEnum} from '@common/shared/ui-components/data/table/table.consts';

@Component({
    selector: 'sm-projects-header',
    templateUrl: './projects-header.component.html',
    styleUrls: ['./projects-header.component.scss'],
    standalone: false
})
export class ProjectsHeaderComponent {
  searchQuery = input<string>();
  sortOrder = input<TableSortOrderEnum>();
  tags = input<string[]>();
  enableTagsFilter = input(false);
  sortByField = input<string>();

  sortByTitle = computed(() => this.sortByField().includes('name') ? 'NAME' : 'RECENT');

  orderByChanged = output<string>();
  searchChanged = output<string>();
}


