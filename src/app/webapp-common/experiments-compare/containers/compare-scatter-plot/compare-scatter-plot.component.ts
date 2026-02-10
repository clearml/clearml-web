import {Component, computed, ElementRef, inject, input} from '@angular/core';
import {ScatterPlotSeries} from '@common/core/reducers/projects.reducer';
import {
  ExtraTask
} from '@common/experiments-compare/dumbs/parallel-coordinates-graph/parallel-coordinates-graph.component';
import {get} from 'lodash-es';
import {from} from 'rxjs';
import domtoimage from 'dom-to-image';
import {take} from 'rxjs/operators';
import {SelectedMetricVariant} from '@common/experiments-compare/experiments-compare.constants';
import {MetricVariantToPathPipe} from '@common/shared/pipes/metric-variant-to-path.pipe';
import {ScatterPlotComponent} from '@common/shared/components/charts/scatter-plot/scatter-plot.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';


@Component({
  selector: 'sm-compare-scatter-plot',
  templateUrl: './compare-scatter-plot.component.html',
  styleUrls: ['./compare-scatter-plot.component.scss'],
  imports: [
    ScatterPlotComponent,
    MatIconModule,
    TooltipDirective,
    MatIconButton
  ]
})
export class CompareScatterPlotComponent {
  private ref = inject(ElementRef);
  public metricVariantToPathPipe = new MetricVariantToPathPipe;

  metric = input<string>();
  metricName = input<string>();
  params = input<{section: string; name: string}[]>();
  extraHoverInfoParams = input<{section: string; name: string}[]>([]);
  extraHoverInfoMetrics = input<SelectedMetricVariant[]>([]);
  experiments = input<ExtraTask[]>();

  protected xAxisLabel = computed(() => this.params()?.[0] ? `${this.params()?.[0].section}.${this.params()?.[0].name}` : '');

  protected scalar = computed(() => this.experiments()
    .map(point => point.hyperparams[this.params()[0].section]?.[this.params()[0].name]?.value)
    .filter((paramValue) => paramValue !== undefined)
    .some(paramValue => isNaN(parseFloat(paramValue)))
  );

  protected graphData = computed<ScatterPlotSeries[]>(() => {
    if (this.experiments() && this.params() && this.metric()) {
      return [{
        label: '',
        backgroundColor: '#14aa8c',
        data: this.experiments()
          .map(point => [point, point.hyperparams[this.params()[0].section]?.[this.params()[0].name]?.value])
          .filter(([, paramValue]) => paramValue !== undefined)
          .map(([point, paramValue]) => {
            const numericParam = parseFloat(paramValue);
            return {
              x: !isNaN(numericParam) ? numericParam : paramValue,
              y: get(point.last_metrics, this.metric()),
              id: point.id,
              name: point.name,
              extraParamsHoverInfo: this.extraHoverInfoParams()
                .map(param =>
                  `${param.section}.${param.name}: ${point.hyperparams[this.params()[0].section]?.[this.params()[0].name]?.value}`
                )
                .concat(this.extraHoverInfoMetrics().map(metric => {
                    const metricVar = get(point.last_metrics, this.metricVariantToPathPipe.transform(metric));
                    return `${metric?.metric}/${metric?.variant}: value: ${metricVar?.value}, min: ${metricVar?.min_value}, max: ${metricVar?.max_value}`;
                  })
                )
            };
          }),
      } as ScatterPlotSeries];
    }
    return [];
  });

  downloadImage() {
    from(domtoimage.toBlob(this.ref.nativeElement))
      .pipe(take(1))
      .subscribe((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.download = `Hyperparam scatter ${Array.isArray(this.params()) ? this.params()[0] : this.params()} x ${this.metric()}`;
        a.click();
      });
  }
}
