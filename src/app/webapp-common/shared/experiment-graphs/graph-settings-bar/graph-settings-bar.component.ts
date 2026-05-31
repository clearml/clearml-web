import {ChangeDetectionStrategy, Component, computed, input, output, signal} from '@angular/core';
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
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {injectResize} from 'ngxtension/resize';
import {distinctUntilChanged, map} from 'rxjs';
import {PushPipe} from '@ngrx/component';

@Component({
  selector: 'sm-graph-settings-bar',
  templateUrl: './graph-settings-bar.component.html',
  styleUrls: ['./graph-settings-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    TooltipDirective,
    MatSlideToggle,
    PushPipe
  ]
})
export class GraphSettingsBarComponent {
  protected shortMode$ = injectResize({emitInitialResult: true})
    .pipe(
      map(res => res.width),
      distinctUntilChanged(),
      map(width => width < this.shortModeWidth)
    );
  private readonly shortModeWidth = 1250;
  protected readonly scalarKeyEnum = ScalarKeyEnum;
  protected readonly round = Math.round;
  protected readonly smoothTypeEnum = smoothTypeEnum;
  protected readonly xAxisTypeOption = [
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


  showLineWidth = input<boolean>(false);
  smoothWeight = input<number>();
  smoothSigma = input<number>();
  smoothType = input<SmoothTypeEnum>();
  xAxisType = input<ScalarKeyEnum>(ScalarKeyEnum.Iter);
  groupBy = input<GroupByCharts>('metric');
  showOrigin = input<boolean>(true);
  lineWidth = input<number>(1);
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
  changeLineWidth = output<number>();
  changeShowOrigin = output<boolean>();
  toggleSettings = output();
  setToProject = output();

  smoothState = computed(() => ({
    smoothWeight: this.smoothWeight(),
    weight: signal(this.smoothWeight()),
    smoothSigma: this.smoothSigma(),
    sigma: signal(this.smoothSigma())
  }));

  localLineWidth = computed(() => ({
    width: this.lineWidth()
  }))

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

  protected lineWidthChanged(width: number) {
    this.changeLineWidth.emit(width);

  }
}
