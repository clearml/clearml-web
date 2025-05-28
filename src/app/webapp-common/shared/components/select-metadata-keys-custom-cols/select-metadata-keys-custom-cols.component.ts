import {ChangeDetectionStrategy, Component, computed, input, output, signal} from '@angular/core';
import {ISmCol} from '../../ui-components/data/table/table.consts';
import {SearchComponent} from '@common/shared/ui-components/inputs/search/search.component';
import {MenuItemComponent} from '@common/shared/ui-components/panel/menu-item/menu-item.component';
import {SimpleFilterPipe} from '@common/shared/pipes/simple-filter.pipe';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';

@Component({
    selector: 'sm-select-metadata-keys-custom-cols',
    templateUrl: './select-metadata-keys-custom-cols.component.html',
    styleUrls: ['./select-metadata-keys-custom-cols.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        SearchComponent,
        MenuItemComponent,
        SimpleFilterPipe,
        MatProgressSpinnerModule,
        ClickStopPropagationDirective
    ]
})
export class SelectMetadataKeysCustomColsComponent {
  searchText = signal<string>('');
  title = input<string>();
  metadataKeys = input<string[]>();
  singleSelect = input<boolean>();
  tableCols = input<ISmCol[]>()
  metadataColsIds = computed(() => this.tableCols()?.filter(col => col.type === 'metadata' || col.type==='hdmd').map(col => col.key))

  addMetadataKey = output<string>();
  addOrRemoveMetadataKeyFromColumns = output<{ key: string; show: boolean }>();
  goBack = output<void>();

  searchQ(search: string) {
    this.searchText.set(search);
  }

}
