import {Component, ContentChild, TemplateRef, input, output} from '@angular/core';
import {CdkDrag, CdkDragDrop, CdkDropList} from '@angular/cdk/drag-drop';
import {FormsTrackBy} from '../../../utils/forms-track-by';
import { NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'sm-simple-table-2',
    templateUrl: './simple-table.component.html',
    styleUrls: ['./simple-table.component.scss'],
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
  rowsData = input<any[]>();
  cols = input<{
        class: string;
        header: string;
        subHeader?: string;
    }[]>();
  hideHeaders = input(false);
  enableDragAndDrop = input(false);
  noDataMessage = input<string>();
  entryDropped = output<CdkDragDrop<any>>();

  @ContentChild(TemplateRef) templateRef: TemplateRef<any>;

  isRowToggleable(rowIndex: number) {
    return this.rowsConfig()[rowIndex] && this.rowsConfig()[rowIndex].collapsible;
  }

  toggleRow(rowIndex: number) {
    if (this.isRowToggleable(rowIndex)) {
      this.open[rowIndex] = !this.open[rowIndex];
    }
  }

  drop($event: CdkDragDrop<any, any>) {
    this.entryDropped.emit($event);
  }
}
