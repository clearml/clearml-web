import {Component, TemplateRef, input, computed} from '@angular/core';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {NgTemplateOutlet} from '@angular/common';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';

@Component({
    selector: 'sm-table-card',
    templateUrl: './table-card.component.html',
    styleUrls: ['./table-card.component.scss'],
    imports: [
        NgTemplateOutlet
    ]
})
export class TableCardComponent {
  columns = input<ISmCol[]>();
  cardName = input<string>();
  rowData = input<{id: string}>();
  activeContextRow = input<{id: string}>();
  contextMenuOpen = input<boolean>();
  entityType = input<EntityTypeEnum>()
  selected = input<boolean>();
  checked = input<boolean>();
  noSelection = input(false);
  tagsTemplate = input<TemplateRef<unknown>>();
  compactColDataTemplate = input<TemplateRef<unknown>>();

  protected hasTypeIcon = computed(() => this.entityType() === EntityTypeEnum.experiment);
}
