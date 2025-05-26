import {ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild, inject } from '@angular/core';
import {MatMenu, MatMenuTrigger} from '@angular/material/menu';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {fileSizeConfigStorage, FileSizePipe} from '@common/shared/pipes/filesize.pipe';
import {HesitateDirective} from '@common/shared/ui-components/directives/hesitate.directive';
import {ClipboardModule} from 'ngx-clipboard';
import {MatIcon} from '@angular/material/icon';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {MatIconButton} from '@angular/material/button';
import {PrimeTemplate} from 'primeng/api';


const columnIds = ['name', 'size', 'hash'];

type Row = { [K in typeof columnIds[number]]: string }

interface RowData extends Row {
  id: string
}

@Component({
    selector: 'sm-open-dataset-version-content',
    templateUrl: './open-dataset-version-content.component.html',
    styleUrls: ['./open-dataset-version-content.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatMenu,
        HesitateDirective,
        ClipboardModule,
        MatMenuTrigger,
        MatIcon,
        TableComponent,
        TooltipDirective,
        ShowTooltipIfEllipsisDirective,
        MatIconButton,
        PrimeTemplate
    ]
})
export class OpenDatasetVersionContentComponent {
  private readonly ref = inject(ElementRef);
  public columns: ISmCol[];
  public tableData: RowData[];
  public command: string;
  private ngFile = new FileSizePipe();

  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  copySuccess: boolean;
  private colSizes = {} as Record<string, number>;

  @Input() set id(id: string) {
    this.command = `clearml-data get --id ${id}`;
    this.copySuccess = false;
  }

  @Input() set data(csv: string) {
    const lines = csv?.trimEnd().split('\n') ?? [];
    const header = lines.splice(0, 1)[0] ?? '';
    const colWidth = (this.ref.nativeElement.getBoundingClientRect().width - 150) / 2;
    this.columns = header.split(/, ?/)
      .map((caption, index) => {
        const width = this.colSizes?.[columnIds[index]] ? `${this.colSizes[columnIds[index]]}px` : null;
        return {
          id: columnIds[index],
          header: caption,
          style: index === 1 ?
            {width: width ?? '150px'} :
            {
              // maxWidth: width ?? `${colWidth}px`,
              width: width ?? `${colWidth}px`,
            }
        };
      });
    const tableData = lines.map((line, index) => ({
      ...line.split(/, ?/).reduce((acc, val, i) => {
        acc[columnIds[i]] = val;
        return acc;
      }, {} as Row),
      id: `${index}`
    } as RowData));
    if (Number(tableData[0]?.size) && this.columns[1]?.header?.includes('ize')) {
      this.tableData = tableData.map( line => ({
        ...line,
        size: this.ngFile.transform(parseInt(line.size, 10) || 0, fileSizeConfigStorage) as string
      }));
    } else {
      this.tableData = tableData;
    }

  }

  openMenu() {
    this.trigger.openMenu();
  }

  copied() {
    this.copySuccess = true;
    window.setTimeout(() => this.copySuccess = false, 3000);
  }

  resizeCol({columnId, widthPx}: {columnId: string, widthPx: number}) {
    this.colSizes[columnId] = widthPx;
    this.columns = this.columns.map(col => col.id === columnId ? {...col, style: {width: widthPx + 'px'}} : col);
  }
}
