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
import {animate, state, style, transition, trigger} from '@angular/animations';

@Component({
    selector: 'sm-pipeline-controller-step',
    templateUrl: './pipeline-controller-step.component.html',
    styleUrls: ['./pipeline-controller-step.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('openClose', [
            state('open', style({
                transform: 'scale(3)',
                opacity: 0
            })),
            state('closed', style({
                opacity: 1,
            })),
            transition('closed => open', [animate('0.35s')]),
        ]),
    ],
    standalone: false
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
  enlarged = false;


  expandG($event: any) {
    if ($event.toState === 'open') {
      this.expandStage.emit($event);

    }
  }

  toggleEnlarge() {
    // Real work is done after animation by expandG function
    this.expandStageAnimationStarted.emit()
    this.enlarged = !this.enlarged;
  }
}
