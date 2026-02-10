import {
  ChangeDetectionStrategy,
  Component,
  output, input, computed, signal
} from '@angular/core';
import {
  PipelineItem,
} from '@common/pipelines-controller/pipeline-controller-info/pipeline-controller-info.component';
import {interval, of, switchMap} from 'rxjs';
import {StepStatusEnum} from '@common/experiments/actions/common-experiments-info.actions';
import {toObservable} from '@angular/core/rxjs-interop';
import {map} from 'rxjs/operators';
import {
  ExperimentTypeIconLabelComponent
} from '@common/shared/experiment-type-icon-label/experiment-type-icon-label.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {MatIconButton} from '@angular/material/button';
import {DurationPipe} from '@common/shared/pipes/duration.pipe';
import {PushPipe} from '@ngrx/component';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'sm-pipeline-controller-step',
  templateUrl: './pipeline-controller-step.component.html',
  styleUrls: ['./pipeline-controller-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExperimentTypeIconLabelComponent,
    MatIconModule,
    TooltipDirective,
    ShowTooltipIfEllipsisDirective,
    MatIconButton,
    DurationPipe,
    PushPipe
  ]
})
export class PipelineControllerStepComponent {
  step = input<PipelineItem>();
  selected = input<boolean>();
  openConsole = output();
  expandStage = output();
  expandStageAnimationStarted = output();

  protected stepWithStatus = computed(() =>
    ({...this.step(), data: {...this.step().data, status: this.step().data?.status || StepStatusEnum.pending}})
  );
  protected runTime$ = toObservable(this.step)
    .pipe(
      switchMap(step => {
        if (step?.data?.job_ended) {
          return of(step.data.job_ended - step?.data?.job_started);
        } else if (step?.data?.job_started && step.data.status === 'running') {
          return interval(1000)
            .pipe(map(() => (Date.now() / 1000) - step.data.job_started));
        } else {
          return of(null);
        }
      })
    );
  protected enlarged = signal(false);

  toggleEnlarge() {
    this.expandStageAnimationStarted.emit()
    this.enlarged.update(value => !value);
  }

  enlargeEnd(event: TransitionEvent) {
    if (event.propertyName === 'transform' && (event.target as HTMLDivElement).classList.contains('open')) {
      this.expandStage.emit();
    }
  }
}
