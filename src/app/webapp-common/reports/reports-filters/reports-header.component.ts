import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {TableSortOrderEnum} from '@common/shared/ui-components/data/table/table.consts';

@Component({
    selector: 'sm-reports-header',
    templateUrl: './reports-header.component.html',
    styleUrls: ['./reports-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
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
