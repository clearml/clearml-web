import {Component, ElementRef, inject, Input, OnChanges, SimpleChanges} from '@angular/core';
import {ScatterPlotSeries} from '@common/core/reducers/projects.reducer';
import {
  ExtraTask
} from '@common/experiments-compare/dumbs/parallel-coordinates-graph/parallel-coordinates-graph.component';
import {get, isEqual} from 'lodash-es';
import {from} from 'rxjs';
import domtoimage from 'dom-to-image';
import {take} from 'rxjs/operators';
import {SelectedMetricVariant} from '@common/experiments-compare/experiments-compare.constants';
import {MetricVariantToPathPipe} from '@common/shared/pipes/metric-variant-to-path.pipe';


@Component({
    selector: 'sm-compare-scatter-plot',
    templateUrl: './compare-scatter-plot.component.html',
    styleUrls: ['./compare-scatter-plot.component.scss'],
    standalone: false
})
export class CompareScatterPlotComponent implements OnChanges {
  public metricVariantToPathPipe = new MetricVariantToPathPipe;
  public graphData: ScatterPlotSeries[];
  public scalar: boolean;

  @Input() metric: string;
  @Input() metricName!: string;
  @Input() params: string | string[];
  @Input() extraHoverInfoParams: string[] = [];
  @Input() extraHoverInfoMetrics: SelectedMetricVariant[] = [];
  @Input() experiments: ExtraTask[];

  private ref = inject(ElementRef);


  ngOnChanges(changes:SimpleChanges): void {
    this.scalar = true;
    if (this.experiments && this.params && this.metric) {
      const newGraphData = [{
        label: '',
        backgroundColor: '#14aa8c',
        data: this.experiments
          .map(point => [point, get(point.hyperparams, Array.isArray(this.params) ? `${this.params[0]}.value` : this.params)])
          .filter(([, param]) => param !== undefined)
          .map(([point, param]) => {
            const numericParam = parseFloat(param);
            if (isNaN(numericParam)) {
              this.scalar = false;
            }
            return {
              x: isNaN(numericParam) ? numericParam : param,
              y: get(point.last_metrics, this.metric),
              id: point.id,
              name: point.name,
              extraParamsHoverInfo: this.extraHoverInfoParams.map(param => `${param}: ${get(point.hyperparams, param)?.value}`).concat(
                this.extraHoverInfoMetrics.map(metric => {
                  const metricVar = get(point.last_metrics, this.metricVariantToPathPipe.transform(metric));
                  return `${metric?.metric}/${metric?.variant}: value: ${metricVar?.value}, min: ${metricVar?.min_value}, max: ${metricVar?.max_value}`;
                })
              )
            };
          }),
      } as ScatterPlotSeries];
      if (!isEqual(newGraphData, this.graphData)  || (changes.metricName?.currentValue!== changes.metricName?.previousValue) || (changes.params?.currentValue!== changes.params?.previousValue)) {
        this.graphData = newGraphData;
      }
    }
  }

  downloadImage() {
    from(domtoimage.toBlob(this.ref.nativeElement))
      .pipe(take(1))
      .subscribe((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.download = `Hyperparam scatter ${Array.isArray(this.params) ? this.params[0] : this.params} x ${this.metric}`;
        a.click();
      });
  }
}
