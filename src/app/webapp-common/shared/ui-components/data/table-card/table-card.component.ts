import {Component, TemplateRef, input, computed, inject} from '@angular/core';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {NgTemplateOutlet} from '@angular/common';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {ColorHashService} from '@common/shared/services/color-hash/color-hash.service';
import {generateColorKey} from '@common/shared/single-graph/single-graph.utils';
import {normalizeColorToString} from '@common/shared/services/color-hash/color-hash.utils';

@Component({
  selector: 'sm-table-card',
  templateUrl: './table-card.component.html',
  styleUrls: ['./table-card.component.scss'],
  imports: [
    NgTemplateOutlet
  ]
})
export class TableCardComponent {
  private colorHash = inject(ColorHashService);

  columns = input<ISmCol[]>();
  cardName = input<string>();
  showColor = input<boolean>();
  rowData = input<{ id: string }>();
  activeContextRow = input<{ id: string }>();
  contextMenuOpen = input<boolean>();
  entityType = input<EntityTypeEnum>();
  selected = input<boolean>();
  checked = input<boolean>();
  noSelection = input(false);
  tagsTemplate = input<TemplateRef<unknown>>();
  compactColDataTemplate = input<TemplateRef<unknown>>();

  protected hasTypeIcon = computed(() => this.entityType() === EntityTypeEnum.experiment);

  keyColor = computed(() => generateColorKey(this.cardName(), this.rowData().id, undefined, true));
  color = computed(() => this.showColor() ? normalizeColorToString(this.colorHash.initColor(this.keyColor())) : null);

}
