import {Component, computed, ElementRef, HostListener, inject, input, Input, output, signal} from '@angular/core';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import {MatFormField, MatOption, MatSelect, MatSelectChange} from '@angular/material/select';
import {GroupByCharts} from '@common/experiments/actions/common-experiment-output.actions';
import {SmoothTypeEnum, smoothTypeEnum} from '@common/shared/single-graph/single-graph.utils';
import {MatSlider, MatSliderThumb} from '@angular/material/slider';
import {FormsModule} from '@angular/forms';
import {KeyValuePipe} from '@angular/common';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatIconButton} from '@angular/material/button';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';

@Component({
  selector: 'sm-graph-settings-bar',
  templateUrl: './graph-settings-bar.component.html',
  styleUrls: ['./graph-settings-bar.component.scss'],
  imports: [
    MatFormField,
    MatSelect,
    MatOption,
    MatSlider,
    FormsModule,
    MatSliderThumb,
    KeyValuePipe,
    MatIcon,
    MatIconButton,
    MatButton,
    TooltipDirective
  ]
})
export class GraphSettingsBarComponent {
  private readonly shortModeWidth = 1250;
  readonly scalarKeyEnum = ScalarKeyEnum;
  readonly round = Math.round;
  protected readonly smoothTypeEnum = smoothTypeEnum;
  private el = inject(ElementRef);

  public shortMode = signal(this.el.nativeElement.clientWidth < this.shortModeWidth);

  @Input() set splitSize(splitSize: number) {
    this.shortMode.set(this.el.nativeElement.clientWidth < this.shortModeWidth);
  }

  smoothWeight = input<number>();
  smoothSigma = input<number>();
  smoothType = input<SmoothTypeEnum>();
  xAxisType = input<ScalarKeyEnum>(ScalarKeyEnum.Iter);
  groupBy = input<GroupByCharts>('metric');
  groupByOptions = input<{
        name: string;
        value: GroupByCharts;
    }[]>();
  verticalLayout = input<boolean>(false);
  clearable = input<boolean>(false);
  changeWeight = output<number>();
  changeSigma = output<number>();
  changeSmoothType = output<SmoothTypeEnum>();
  changeXAxisType = output<ScalarKeyEnum>();
  changeGroupBy = output<GroupByCharts>();
  toggleSettings = output();
  setToProject = output();

  smoothState = computed(() => ({
    smoothWeight: this.smoothWeight(),
    weight: signal(this.smoothWeight()),
    smoothSigma: this.smoothSigma(),
    sigma: signal(this.smoothSigma())
  }));

  @HostListener('window:resize')
  onResize() {
    this.shortMode.set(this.el.nativeElement.clientWidth < this.shortModeWidth);
  }

  xAxisTypeOption = [
    {
      name: 'Iterations',
      value: ScalarKeyEnum.Iter
    },
    {
      name: 'Time from start',
      value: ScalarKeyEnum.Timestamp
    },
    {
      name: 'Wall time',
      value: ScalarKeyEnum.IsoTime
    },
  ];

  constructor() {
    window.setTimeout(() => {
      this.shortMode.set(this.el.nativeElement.clientWidth < this.shortModeWidth);
    }, 100);
  }
  xAxisTypeChanged(key: MatSelectChange) {
    this.changeXAxisType.emit(key.value);
  }

  groupByChanged(key: MatSelectChange) {
    this.changeGroupBy.emit(key.value);
  }

  selectSmoothType($event: MatSelectChange) {
    this.changeWeight.emit([smoothTypeEnum.exponential, smoothTypeEnum.any].includes($event.value) ? 0 : $event.value=== smoothTypeEnum.gaussian? 7: $event.value=== smoothTypeEnum.runningAverage? 5: 10);
    this.changeSmoothType.emit($event.value);
  }


  setToProjectLevel() {
    this.setToProject.emit()
  }
}
