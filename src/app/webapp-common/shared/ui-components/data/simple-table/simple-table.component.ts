import {Component, TemplateRef, input, output, contentChild, ChangeDetectionStrategy} from '@angular/core';
import {CdkDrag, CdkDragDrop, CdkDropList} from '@angular/cdk/drag-drop';
import {FormsTrackBy} from '../../../utils/forms-track-by';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'sm-simple-table-2',
  templateUrl: './simple-table.component.html',
  styleUrls: ['./simple-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkDropList,
    NgTemplateOutlet,
    CdkDrag
  ]
})
export class SimpleTableComponent extends FormsTrackBy {

  public open = [];

  get formData() {
    return this.rowsData();
  }
  rowsConfig = input<{collapsible: boolean;}[]>([]);
  rowsData = input<unknown[]>();
  cols = input<{
        class: string;
        header: string;
        subHeader?: string;
    }[]>();
  hideHeaders = input(false);
  enableDragAndDrop = input(false);
  noDataMessage = input<string>();
  entryDropped = output<CdkDragDrop<any>>();

  templateRef = contentChild(TemplateRef<{$implicit: {
      class: string;
      header: string;
      subHeader?: string;
    },
    row: unknown, rowIndex: number
  }>);

  isRowToggleable(rowIndex: number) {
    return this.rowsConfig()[rowIndex] && this.rowsConfig()[rowIndex].collapsible;
  }

  toggleRow(rowIndex: number) {
    if (this.isRowToggleable(rowIndex)) {
      this.open[rowIndex] = !this.open[rowIndex];
    }
  }

  drop($event: CdkDragDrop<unknown, unknown>) {
    this.entryDropped.emit($event);
  }
}
