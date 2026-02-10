import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {createMetricColumn} from '@common/shared/utils/tableParamEncode';
import {trackById} from '@common/shared/utils/forms-track-by';
import {SelectMetricForCustomColComponent} from '@common/experiments/dumb/select-metric-for-custom-col/select-metric-for-custom-col.component';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {MatIcon} from '@angular/material/icon';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatButton, MatIconButton} from '@angular/material/button';

export interface MetricForStatsData {
  variants: MetricVariantResult[];
  metricVariantSelection: ISmCol[];
  projectId: string
}


@Component({
  selector: 'sm-metric-for-stats-dialog',
  templateUrl: './metric-for-stats-dialog.component.html',
  styleUrls: ['./metric-for-stats-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SelectMetricForCustomColComponent,
    DialogTemplateComponent,
    MatIcon,
    ShowTooltipIfEllipsisDirective,
    TooltipDirective,
    MatButton,
    MatIconButton
  ]
})
export class MetricForStatsDialogComponent {
  private matDialogRef = inject(MatDialogRef<MetricForStatsDialogComponent>);
  protected data = inject<MetricForStatsData>(MAT_DIALOG_DATA);
  protected metricVariantSelection = signal(this.data.metricVariantSelection ?? []);

  selectionChange(event) {
    if(event && !event.valueType) {
      return;
    }
    const variantCol = createMetricColumn({
      metricHash: event.variant.metric_hash,
      variantHash: event.variant.variant_hash,
      valueType: event.valueType,
      metric: event.variant.metric,
      variant: event.variant.variant
    }, this.data.projectId);

    if (event.addCol) {
      this.metricVariantSelection.update(selection => [...selection, variantCol]);
    } else {
      this.metricVariantSelection.update(selection => selection.filter(col => col.id !== variantCol.id));
    }
  }

  clear(){
    this.metricVariantSelection.set([]);
  }

  close(selection?) {
    this.matDialogRef.close(selection);
  }

  protected readonly trackById = trackById;

  removeExperiment(column: ISmCol) {
    this.metricVariantSelection.update(selection => selection.filter(col => col.id !== column.id));
  }
}
