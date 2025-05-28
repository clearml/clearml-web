import {ChangeDetectionStrategy, Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {createMetricColumn} from '@common/shared/utils/tableParamEncode';
import {trackById} from '@common/shared/utils/forms-track-by';

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
    standalone: false
})
export class MetricForStatsDialogComponent {
  public variants: MetricVariantResult[];
  public metricVariantSelection: ISmCol[];
  private readonly projectId: string;

  constructor(
    private matDialogRef: MatDialogRef<MetricForStatsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) {variants, metricVariantSelection, projectId}: MetricForStatsData
  ) {
    this.variants = variants;
    this.metricVariantSelection = [...metricVariantSelection];
    this.projectId = projectId;
  }

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
    }, this.projectId);
    if (event.addCol) {
      this.metricVariantSelection = [...this.metricVariantSelection, variantCol];
    } else {
      this.metricVariantSelection = this.metricVariantSelection.filter(col => col.id !== variantCol.id)
    }
  }

  clear(){
    this.metricVariantSelection = [];
  }

  close(selection?) {
    this.matDialogRef.close(selection);
  }

  protected readonly trackById = trackById;

  removeExperiment(column: ISmCol) {
    this.metricVariantSelection = this.metricVariantSelection.filter(col => col.id !== column.id)
  }
}
